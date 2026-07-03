import type { GitLabClient } from '../gitlab/client';
import {
  pathForExpense,
  pathForReport,
  reportPathsToInvalidate,
} from '../gitlab/paths';
import {
  appendExpense,
  buildExpenseEntry,
  validateAddExpenseInput,
} from '../domain/expenses';
import {
  defaultMetadata,
  mergeCategory,
  metadataUpdateAction,
} from '../domain/metadata';
import type { CommitAction, ExpenseEntry, Metadata } from '../types';
import { AppError } from '../util/errors';

const MAX_RETRIES = 3;

export async function handleAdd(client: GitLabClient, body: unknown) {
  const input = validateAddExpenseInput(body);
  const entry = buildExpenseEntry(input);
  const expensePath = pathForExpense(input.timestamp);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptAdd(client, input, entry, expensePath);
      return result;
    } catch (err) {
      if (attempt === MAX_RETRIES || !(err instanceof AppError) || !err.retryable) {
        throw err;
      }
    }
  }

  throw new AppError('Failed to add expense after retries', 409, true);
}

async function attemptAdd(
  client: GitLabClient,
  input: ReturnType<typeof validateAddExpenseInput>,
  entry: ReturnType<typeof buildExpenseEntry>,
  expensePath: string,
) {
  const [existingEntries, existingMetadata, expenseFileExists, metadataFileExists] =
    await Promise.all([
      client.getFileJson<ExpenseEntry[]>(expensePath),
      client.getFileJson<Metadata>('metadata.json'),
      client.fileExists(expensePath),
      client.fileExists('metadata.json'),
    ]);

  const updatedEntries = appendExpense(existingEntries, entry);
  const baseMetadata = existingMetadata ?? defaultMetadata();
  const { metadata, changed: metadataChanged } = mergeCategory(
    baseMetadata,
    input.category,
    input.subcategory,
  );

  const actions: CommitAction[] = [
    {
      action: expenseFileExists ? 'update' : 'create',
      file_path: expensePath,
      content: JSON.stringify(updatedEntries, null, 2) + '\n',
    },
  ];

  if (metadataChanged) {
    actions.push(metadataUpdateAction(metadata, metadataFileExists));
  }

  for (const reportPath of reportPathsToInvalidate(input.timestamp)) {
    if (await client.fileExists(reportPath)) {
      actions.push({ action: 'delete', file_path: reportPath });
    }
  }

  const message =
    `add expense: ${input.category}/${input.subcategory} ${input.amount.toFixed(2)}`;
  const commit = await client.createCommit(message, actions);

  return {
    ok: true,
    id: entry.id,
    commitSha: commit.id,
  };
}
