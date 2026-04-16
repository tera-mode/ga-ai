'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { formatBytes, estimateCost, formatNumber } from '@/lib/utils';
import type { ConnectionTestResult } from '@/types';

interface Check {
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  detail?: string;
}

interface Props {
  projectId: string;
  dataset: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function Step4Test({ projectId, dataset, onSuccess, onBack }: Props) {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'BigQueryへの接続確認', status: 'pending' },
    { label: 'events_テーブルの存在確認', status: 'pending' },
    { label: 'サンプルクエリの実行（直近7日）', status: 'pending' },
  ]);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [done, setDone] = useState(false);

  const setCheck = (i: number, status: Check['status'], detail?: string) => {
    setChecks((prev) => prev.map((c, idx) => idx === i ? { ...c, status, detail } : c));
  };

  const runTest = async () => {
    setDone(false);
    setResult(null);
    setChecks([
      { label: 'BigQueryへの接続確認', status: 'running' },
      { label: 'events_テーブルの存在確認', status: 'pending' },
      { label: 'サンプルクエリの実行（直近7日）', status: 'pending' },
    ]);

    await new Promise((r) => setTimeout(r, 600));

    try {
      setCheck(0, 'success');
      setCheck(1, 'running');

      await new Promise((r) => setTimeout(r, 400));

      const res = await fetch('/api/bq/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, dataset }),
      });
      const data = await res.json() as ConnectionTestResult;

      if (!data.success) {
        setCheck(1, 'error', data.error);
        setCheck(2, 'error');
        setDone(true);
        return;
      }

      setCheck(1, 'success');
      setCheck(2, 'running');

      await new Promise((r) => setTimeout(r, 300));
      setCheck(2, 'success', `${formatNumber(data.eventCount ?? 0)} イベント`);
      setResult(data);
      setDone(true);
    } catch (e) {
      setCheck(0, 'error', String(e));
      setDone(true);
    }
  };

  useEffect(() => { runTest(); }, []);

  const allSuccess = checks.every((c) => c.status === 'success');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">接続テスト</h2>
        <p className="mt-1 text-sm text-gray-500">
          BigQueryへの接続と実際のクエリ実行を確認しています。
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {c.status === 'running' && <Spinner className="h-5 w-5" />}
              {c.status === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {c.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {c.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-200" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${
                c.status === 'success' ? 'text-emerald-700'
                : c.status === 'error' ? 'text-red-600'
                : 'text-gray-700'
              }`}>
                {c.label}
              </p>
              {c.detail && <p className="text-xs text-gray-400 mt-0.5">{c.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      {result && allSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
          <p className="font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> 接続成功
          </p>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm mt-2">
            <span className="text-gray-500">過去7日間のイベント数</span>
            <span className="text-gray-800 font-mono">{formatNumber(result.eventCount ?? 0)}</span>
            {result.oldestDate && (
              <>
                <span className="text-gray-500">データ期間</span>
                <span className="text-gray-800">{result.oldestDate} 〜 {result.latestDate}</span>
              </>
            )}
            {result.scanBytes !== undefined && (
              <>
                <span className="text-gray-500">スキャンサイズ</span>
                <span className="text-gray-800">
                  {formatBytes(result.scanBytes)}（{estimateCost(result.scanBytes)}相当）
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {done && !allSuccess && (
        <Button variant="outline" onClick={runTest}>再テスト</Button>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack}>戻る</Button>
        {allSuccess && (
          <Button className="flex-1" onClick={onSuccess}>
            次へ（スキーマ取得） <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
