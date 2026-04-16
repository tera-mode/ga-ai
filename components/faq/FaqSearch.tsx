'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { FAQS } from '@/content/faq/faq-data';
import { FaqItem } from './FaqItem';
import type { FaqItem as FaqItemType } from '@/content/faq/faq-data';

const fuse = new Fuse<FaqItemType>(FAQS, {
  keys: [
    { name: 'question', weight: 2 },
    { name: 'answer', weight: 1 },
    { name: 'tags', weight: 1.5 },
  ],
  threshold: 0.4,
  includeScore: true,
});

interface Props {
  onSearchActive: (active: boolean) => void;
}

export function FaqSearch({ onSearchActive }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FaqItemType[]>([]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length < 1) {
      setResults([]);
      onSearchActive(false);
    } else {
      const hits = fuse.search(val).map((r) => r.item);
      setResults(hits);
      onSearchActive(true);
    }
  }, [onSearchActive]);

  const clear = () => {
    setQuery('');
    setResults([]);
    onSearchActive(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="キーワードで検索（例: 費用、権限、切り替え）"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="検索をクリア"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {results.length > 0 ? (
            <>
              <div className="border-b border-gray-100 px-4 py-2.5">
                <span className="text-xs text-gray-500">{results.length}件見つかりました</span>
              </div>
              {results.map((item) => (
                <FaqItem key={item.id} item={item} />
              ))}
            </>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              「{query}」に一致する質問が見つかりませんでした
            </div>
          )}
        </div>
      )}
    </div>
  );
}
