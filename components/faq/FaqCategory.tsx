'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { FaqItem } from './FaqItem';
import type { FaqItem as FaqItemType } from '@/content/faq/faq-data';

interface Props {
  icon: string;
  label: string;
  items: FaqItemType[];
  defaultOpen?: boolean;
  openItemId?: string | null;
}

export function FaqCategory({ icon, label, items, defaultOpen = false, openItemId }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  // Open the category when a hash item inside it becomes known
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 font-semibold text-gray-900">{label}</span>
        <span className="text-xs text-gray-400 mr-2">{items.length}件</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {items.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              defaultOpen={item.id === openItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
