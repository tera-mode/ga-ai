import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'GCPプロジェクト' },
  { n: 2, label: 'GA4プロパティ' },
  { n: 3, label: 'BQ診断' },
  { n: 4, label: '接続テスト' },
  { n: 5, label: 'スキーマ取得' },
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  done
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.n}
              </div>
              <span
                className={cn(
                  'text-[10px] whitespace-nowrap font-medium',
                  active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-10 mx-1 mb-5 transition-colors',
                  done ? 'bg-emerald-300' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
