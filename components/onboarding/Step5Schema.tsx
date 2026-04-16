'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
import type { PropertySchema } from '@/types';

interface Step {
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  detail?: string;
}

interface Props {
  projectId: string;
  dataset: string;
  propertyId: string;
  propertyName: string;
  onComplete: (schema: PropertySchema) => void;
  onBack: () => void;
}

export function Step5Schema({
  projectId, dataset, propertyId, propertyName, onComplete, onBack,
}: Props) {
  const [steps, setSteps] = useState<Step[]>([
    { label: 'events_テーブルのスキーマを取得', status: 'pending' },
    { label: 'カスタムディメンション・メトリクスを検出（Admin API）', status: 'pending' },
    { label: 'event_paramsの実在キーを検出', status: 'pending' },
    { label: 'user_propertiesの実在キーを検出', status: 'pending' },
  ]);
  const [schema, setSchema] = useState<PropertySchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStep = (i: number, status: Step['status'], detail?: string) => {
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status, detail } : s));
  };

  const fetchSchema = async () => {
    setError(null);
    setSchema(null);
    setSteps([
      { label: 'events_テーブルのスキーマを取得', status: 'running' },
      { label: 'カスタムディメンション・メトリクスを検出（Admin API）', status: 'pending' },
      { label: 'event_paramsの実在キーを検出', status: 'pending' },
      { label: 'user_propertiesの実在キーを検出', status: 'pending' },
    ]);

    try {
      await new Promise((r) => setTimeout(r, 500));
      setStep(0, 'success');
      setStep(1, 'running');

      const res = await fetch('/api/bq/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, dataset, propertyId }),
      });
      const data = await res.json() as { schema?: PropertySchema; error?: string };

      if (!res.ok || !data.schema) {
        throw new Error(data.error ?? 'Schema fetch failed');
      }

      setStep(1, 'success', `カスタムディメンション ${data.schema.customDimensions.length}個、メトリクス ${data.schema.customMetrics.length}個`);
      setStep(2, 'running');
      await new Promise((r) => setTimeout(r, 300));
      setStep(2, 'success', `${data.schema.detectedEventParams.length}キーを検出`);
      setStep(3, 'running');
      await new Promise((r) => setTimeout(r, 300));
      setStep(3, 'success', `${data.schema.detectedUserProperties.length}キーを検出`);
      setSchema(data.schema);
    } catch (e) {
      setError(String(e));
      setSteps((prev) => prev.map((s) => s.status === 'running' ? { ...s, status: 'error' } : s));
    }
  };

  useEffect(() => { fetchSchema(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">スキーマ取得</h2>
        <p className="mt-1 text-sm text-gray-500">
          「{propertyName}」の構造を学習しています...
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {s.status === 'running' && <Spinner className="h-5 w-5" />}
              {s.status === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {s.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {s.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-200" />}
            </div>
            <div>
              <p className={`text-sm ${s.status === 'success' ? 'text-emerald-700' : s.status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                {s.label}
              </p>
              {s.detail && <p className="text-xs text-gray-400 mt-0.5">{s.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchSchema}>再取得</Button>
        </div>
      )}

      {schema && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-3">
          <p className="font-bold text-lg text-blue-700 flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> セットアップ完了！
          </p>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            <span className="text-gray-500">プロパティ</span>
            <span className="text-gray-800">{propertyName}</span>
            <span className="text-gray-500">カスタムディメンション</span>
            <span className="text-gray-800">{schema.customDimensions.length}個</span>
            <span className="text-gray-500">イベントパラメータ</span>
            <span className="text-gray-800">{schema.detectedEventParams.length}個を検出</span>
          </div>
          <Button className="w-full mt-2" onClick={() => onComplete(schema)}>
            <Sparkles className="h-4 w-4" /> 分析を始める →
          </Button>
        </div>
      )}

      <Button variant="ghost" onClick={onBack}>戻る</Button>
    </div>
  );
}
