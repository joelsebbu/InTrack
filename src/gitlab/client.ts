import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import type {
  CommitAction,
  GitLabCommitResult,
  TreeItem,
} from '../types';
import { AppError } from '../util/errors';

interface GitLabFileResponse {
  content: string;
  encoding: 'base64';
}

let cachedToken: string | null = null;

async function getGitLabToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  const secretArn = process.env.GITLAB_TOKEN_SECRET_ARN;
  if (!secretArn) {
    throw new AppError('GITLAB_TOKEN_SECRET_ARN is not configured', 500);
  }

  const client = new SecretsManagerClient({});
  const result = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );

  if (!result.SecretString) {
    throw new AppError('GitLab token secret is empty', 500);
  }

  cachedToken = result.SecretString;
  return cachedToken;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AppError(`${name} is not configured`, 500);
  }
  return value;
}

function encodeFilePath(path: string): string {
  return encodeURIComponent(path);
}

export class GitLabClient {
  private readonly baseUrl: string;
  private readonly projectId: string;
  private readonly branch: string;

  constructor() {
    this.baseUrl = requireEnv('GITLAB_BASE_URL').replace(/\/$/, '');
    this.projectId = requireEnv('GITLAB_PROJECT_ID');
    this.branch = process.env.GITLAB_BRANCH ?? 'main';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await getGitLabToken();
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 404) {
      throw new AppError('not_found', 404);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new AppError(
        `GitLab API error (${response.status}): ${text}`,
        502,
        response.status >= 500,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async getFileRaw(filePath: string): Promise<string | null> {
    const encoded = encodeFilePath(filePath);
    const token = await getGitLabToken();
    const url =
      `${this.baseUrl}/projects/${this.projectId}` +
      `/repository/files/${encoded}?ref=${encodeURIComponent(this.branch)}`;

    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': token },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new AppError(
        `GitLab read failed (${response.status}): ${text}`,
        502,
        response.status >= 500,
      );
    }

    const data = (await response.json()) as GitLabFileResponse;
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  async getFileJson<T>(filePath: string): Promise<T | null> {
    const raw = await this.getFileRaw(filePath);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async listTree(path: string, recursive = false): Promise<TreeItem[]> {
    const items: TreeItem[] = [];
    let page = 1;

    while (true) {
      const query = new URLSearchParams({
        path,
        ref: this.branch,
        per_page: '100',
        page: String(page),
        ...(recursive ? { recursive: 'true' } : {}),
      });

      const batch = await this.request<TreeItem[]>(
        'GET',
        `/projects/${this.projectId}/repository/tree?${query}`,
      );

      items.push(...batch);
      if (batch.length < 100) {
        break;
      }
      page += 1;
    }

    return items;
  }

  async createCommit(
    message: string,
    actions: CommitAction[],
  ): Promise<GitLabCommitResult> {
    if (actions.length === 0) {
      throw new AppError('No commit actions provided', 400);
    }

    return this.request<GitLabCommitResult>(
      'POST',
      `/projects/${this.projectId}/repository/commits`,
      {
        branch: this.branch,
        commit_message: message,
        actions,
      },
    );
  }

  async fileExists(filePath: string): Promise<boolean> {
    const raw = await this.getFileRaw(filePath);
    return raw !== null;
  }
}
