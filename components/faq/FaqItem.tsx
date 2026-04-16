'use client';

import { useState, useEffect, useId } from 'react';
import { ChevronDown, Link as LinkIcon, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FaqItem as FaqItemType } from '@/content/faq/faq-data';

interface Props {
  item: FaqItemType;
  defaultOpen?: boolean;
}

export function FaqItem({ item, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const contentId = useId();

  // Open and scroll when defaultOpen becomes true (driven by parent hash detection)
  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
      setTimeout(() => {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [defaultOpen, item.id]);

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/faq#${item.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id={item.id} className="border-b border-gray-100 last:border-0">
      <div className="flex items-start hover:bg-gray-50 transition-colors">
        <button
          className="flex flex-1 items-start gap-3 px-4 py-4 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={contentId}
        >
          <ChevronDown
            className={`mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
          <span className="flex-1 text-sm font-medium text-gray-800">{item.question}</span>
        </button>
        <button
          onClick={copyLink}
          className="flex-shrink-0 self-center mr-3 rounded p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          title="リンクをコピー"
          aria-label="このQ&Aのリンクをコピー"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <LinkIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {open && (
        <div id={contentId} className="px-4 pb-5 pl-11">
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
        </div>
      )}
    </div>
  );
}
