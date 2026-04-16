import type { FaqCategory } from './faq-data';

export const FAQ_CATEGORIES: {
  id: FaqCategory;
  label: string;
  icon: string;
}[] = [
  { id: 'getting-started',   label: 'はじめに',               icon: '🚀' },
  { id: 'connection-choice', label: '接続方式の選び方',        icon: '🔀' },
  { id: 'bq-setup',          label: 'BigQuery Export の設定',  icon: '🔗' },
  { id: 'permissions',       label: '権限とセキュリティ',      icon: '🔒' },
  { id: 'cost',              label: '費用について',            icon: '💴' },
  { id: 'data-limits',       label: 'データの制限と精度',      icon: '📊' },
  { id: 'troubleshooting',   label: 'トラブルシューティング',  icon: '🔧' },
] as const;
