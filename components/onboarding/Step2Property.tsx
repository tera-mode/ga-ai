'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChevronRight, RefreshCw, BarChart3 } from 'lucide-react';
import type { GA4Property } from '@/types';

interface Props {
  onNext: (propertyId: string, propertyName: string) => void;
  onBack: () => void;
}

export function Step2Property({ onNext, onBack }: Props) {
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GA4Property | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ga/properties');
      const data = await res.json() as { properties?: GA4Property[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch properties');
      setProperties(data.properties ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const propNum = (p: GA4Property) => p.name.replace('properties/', '');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">GA4プロパティ選択</h2>
        <p className="mt-1 text-sm text-gray-500">
          分析するGA4プロパティを選択してください。
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">プロパティ一覧を取得中...</span>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProperties}>
            <RefreshCw className="h-4 w-4" /> 再取得
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <p className="text-sm text-gray-500">
          アクセスできるGA4プロパティが見つかりません。
          Googleアカウントにアナリティクス権限があることを確認してください。
        </p>
      ) : (
        <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
          {properties.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelected(p)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                selected?.name === p.name
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.displayName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ID: {propNum(p)} · {p.account}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>戻る</Button>
        {selected && (
          <Button
            className="flex-1"
            onClick={() => onNext(selected.name, selected.displayName)}
          >
            「{selected.displayName}」で進む <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={fetchProperties} disabled={loading}>
        <RefreshCw className="h-4 w-4" /> 一覧を更新
      </Button>
    </div>
  );
}
