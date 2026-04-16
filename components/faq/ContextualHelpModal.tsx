'use client';

import { useId } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { X, HelpCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getRelevantFaqs } from '@/lib/faq/getRelevantFaqs';
import { FAQ_CATEGORIES } from '@/content/faq/categories';
import type { OnboardingStep, FaqItem } from '@/content/faq/faq-data';

function ModalFaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex w-full items-start gap-2.5 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <ChevronDown
          className={`mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">{item.question}</span>
      </button>

      {open && (
        <div id={contentId} className="px-4 pb-4 pl-10">
          <div className="prose prose-sm prose-gray max-w-none text-gray-600
            [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs
            [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium [&_th]:text-gray-700
            [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-1.5
            [&_a]:text-blue-600 [&_a:hover]:underline
            [&_strong]:text-gray-800 [&_strong]:font-semibold
            [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-gray-700
            [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5
            [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5
            [&_li]:my-0.5
            [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
          </div>
          <Link
            href={`/faq#${item.id}`}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            FAQページで見る <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  step: OnboardingStep;
}

export function ContextualHelpModal({ open, onClose, step }: Props) {
  const faqs = getRelevantFaqs(step);

  // Determine category label for "see all FAQs" link
  const firstFaq = faqs[0];
  const categoryLabel = firstFaq
    ? FAQ_CATEGORIES.find((c) => c.id === firstFaq.category)?.label
    : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <Dialog.Title className="text-sm font-semibold text-gray-900">
                このステップのよくある質問
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {faqs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                このステップの関連FAQはありません
              </div>
            ) : (
              <div>
                <div className="px-5 py-3 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                  📌 関連する質問（{faqs.length}件）
                </div>
                {faqs.map((item) => (
                  <ModalFaqItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4">
            <div className="text-xs text-gray-400 mb-2">他の質問を探す</div>
            <Link
              href={categoryLabel ? `/faq` : '/faq'}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors w-full justify-center"
            >
              すべてのFAQを見る <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
