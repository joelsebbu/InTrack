import type { CommitAction, Metadata } from '../types';

export function defaultMetadata(): Metadata {
  return {
    categories: {},
    lastUpdated: new Date().toISOString(),
  };
}

export function mergeCategory(
  metadata: Metadata,
  category: string,
  subcategory: string,
): { metadata: Metadata; changed: boolean } {
  const categories = { ...metadata.categories };
  const existing = categories[category] ?? [];
  let changed = false;

  if (!(category in categories)) {
    categories[category] = [subcategory];
    changed = true;
  } else if (!existing.includes(subcategory)) {
    categories[category] = [...existing, subcategory].sort();
    changed = true;
  }

  if (!changed) {
    return { metadata, changed: false };
  }

  return {
    metadata: {
      categories,
      lastUpdated: new Date().toISOString(),
    },
    changed: true,
  };
}

export function metadataUpdateAction(
  metadata: Metadata,
  fileExists: boolean,
): CommitAction {
  return {
    action: fileExists ? 'update' : 'create',
    file_path: 'metadata.json',
    content: JSON.stringify(metadata, null, 2) + '\n',
  };
}
