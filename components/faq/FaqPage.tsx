'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart2 } from 'lucide-react';
import { FAQS } from '@/content/faq/faq-data';
import { FAQ_CATEGORIES } from '@/content/faq/categories';
import { FaqCategory } from './FaqCategory';
import { FaqSearch } from './FaqSearch';

// Categories that are open by default
const DEFAULT_OPEN = new Set(['getting-started', 'connection-choice']);

export function FaqPage() {
  const [searchActive, setSearchActive] = useState(false);
  const [hashItemId, setHashItemId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      setHashItemId(window.location.hash.slice(1));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <BarChart2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">GA4 Analytics Agent</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">よくあるご質問</span>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">よくあるご質問</h1>
          <p className="mt-2 text-gray-500">
            接続方式の選び方・セットアップ・費用・セキュリティについてまとめています
          </p>
        </div>

        {/* Search */}
        <FaqSearch onSearchActive={setSearchActive} />

        {/* Category accordions — hidden while searching */}
        {!searchActive && (
          <div className="space-y-4">
            {FAQ_CATEGORIES.map((cat) => {
              const items = FAQS.filter((f) => f.category === cat.id);
              // If a hash item belongs to this category, open the category
              const shouldOpen =
                DEFAULT_OPEN.has(cat.id) ||
                (hashItemId != null && items.some((i) => i.id === hashItemId));
              return (
                <FaqCategory
                  key={cat.id}
                  icon={cat.icon}
                  label={cat.label}
                  items={items}
                  defaultOpen={shouldOpen}
                  openItemId={hashItemId}
                />
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 text-center space-y-2">
          <p className="text-sm text-gray-500">解決しない場合は、サポートまでご連絡ください。</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
