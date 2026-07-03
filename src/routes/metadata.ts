import type { GitLabClient } from '../gitlab/client';
import { defaultMetadata } from '../domain/metadata';
import type { Metadata } from '../types';

export async function handleGetMetadata(client: GitLabClient) {
  const metadata = await client.getFileJson<Metadata>('metadata.json');
  return metadata ?? defaultMetadata();
}
