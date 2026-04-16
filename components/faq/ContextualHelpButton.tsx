'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { ContextualHelpModal } from './ContextualHelpModal';
import { getRelevantFaqs } from '@/lib/faq/getRelevantFaqs';
import type { OnboardingStep } from '@/content/faq/faq-data';

interface Props {
  step: OnboardingStep;
  variant?: 'fab' | 'inline';
}

export function ContextualHelpButton({ step, variant = 'fab' }: Props) {
  const [open, setOpen] = useState(false);
  const count = getRelevantFaqs(step).length;

  if (variant === 'fab') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-xl transition-all"
          aria-label={`ヘルプ: 関連FAQ ${count}件`}
        >
          <HelpCircle className="h-4 w-4 text-blue-600" />
          ヘルプ
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
              {count}
            </span>
          )}
        </button>
        <ContextualHelpModal open={open} onClose={() => setOpen(false)} step={step} />
      </>
    );
  }

  // inline variant
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        aria-label={`ヘルプ: 関連FAQ ${count}件`}
      >
        <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
        よくある質問
        {count > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-100 px-1 text-xs font-bold text-blue-700">
            {count}
          </span>
        )}
      </button>
      <ContextualHelpModal open={open} onClose={() => setOpen(false)} step={step} />
    </>
  );
}
