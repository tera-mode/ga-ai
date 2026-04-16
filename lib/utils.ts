import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ja-JP');
}

export function estimateCost(bytes: number): string {
  // BigQuery on-demand: $5 per TB
  const tb = bytes / (1024 ** 4);
  const cost = tb * 5;
  if (cost < 0.01) return `$${(cost * 100).toFixed(4)}（< $0.01）`;
  return `$${cost.toFixed(4)}`;
}
