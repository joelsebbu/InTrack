export interface ExpenseEntry {
  id: string;
  timestamp: string;
  category: string;
  subcategory: string;
  amount: number;
  message?: string;
}

export interface Metadata {
  categories: Record<string, string[]>;
  lastUpdated: string;
}

export interface CategorySummary {
  amount: number;
  count: number;
}

export interface Report {
  period: string;
  totalAmount: number;
  entryCount: number;
  byCategory: Record<string, CategorySummary>;
  bySubcategory: Record<string, CategorySummary>;
  generatedAt: string;
}

export type ReportType = 'month' | 'year';

export interface CommitAction {
  action: 'create' | 'update' | 'delete';
  file_path: string;
  content?: string;
}

export interface GitLabCommitResult {
  id: string;
  short_id: string;
  title: string;
}

export interface TreeItem {
  path: string;
  type: 'tree' | 'blob';
}
