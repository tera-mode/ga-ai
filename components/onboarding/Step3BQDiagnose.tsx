'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import type { BQDiagnostic } from '@/types';
import { ContextualHelpButton } from '@/components/faq/ContextualHelpButton';

interface Props {
  propertyId: string;
  propertyName: string;
  onLinked: (dataset: string, projectId: string) => void;
  onFallback: () => void;
  onSetupGuide: () => void;
  onBack: () => void;
}

export function Step3BQDiagnose({
  propertyId, propertyName, onLinked, onFallback, onSetupGuide, onBack,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BQDiagnostic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const diagnose = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ga/bq-link?propertyId=${encodeURIComponent(propertyId)}`);
      const data = await res.json() as BQDiagnostic & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Diagnosis failed');
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { diagnose(); }, [propertyId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">BigQuery Export 診断</h2>
        <p className="mt-1 text-sm text-gray-500">
          「{propertyName}」のBigQuery接続状態を確認しています...
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">BQリンクを確認中...</span>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={diagnose}>
            <RefreshCw className="h-4 w-4" /> 再診断
          </Button>
        </div>
      ) : result?.linked ? (
        /* 連携済み */
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">BigQuery Export が有効です</span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">プロジェクト</span>
              <span className="text-gray-800 font-mono text-xs">{result.link?.project}</span>
              <span className="text-gray-500">データセット</span>
              <span className="text-gray-800 font-mono text-xs">{result.dataset}</span>
              <span className="text-gray-500">日次エクスポート</span>
              <span className={result.link?.dailyExportEnabled ? 'text-emerald-600' : 'text-gray-400'}>
                {result.link?.dailyExportEnabled ? '有効' : '無効'}
              </span>
              <span className="text-gray-500">ストリーミング</span>
              <span className={result.link?.streamingExportEnabled ? 'text-emerald-600' : 'text-gray-400'}>
                {result.link?.streamingExportEnabled ? '有効' : '無効'}
              </span>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => onLinked(result.dataset!, result.projectId!)}
          >
            次へ <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* 未連携 */
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">BigQueryに接続されていません</span>
            </div>
            <p className="text-sm text-gray-500">
              このGA4プロパティはまだBigQueryに接続されていません。
              以下のいずれかを選択してください。
            </p>
          </div>

          <div className="grid gap-3">
            <button
              onClick={onSetupGuide}
              className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-left hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xs bg-blue-100 px-2 py-0.5 rounded-full">推奨</span>
                <div>
                  <p className="font-semibold text-gray-900">BigQuery Exportを設定する（3〜5分）</p>
                  <p className="text-xs text-gray-500 mt-1">
                    高精度な分析、サンプリングなし、長期データ保持
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={onFallback}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-gray-500 font-bold text-xs bg-gray-100 px-2 py-0.5 rounded-full">暫定</span>
                <div>
                  <p className="font-semibold text-gray-900">GA4 Data API経由で今すぐ始める</p>
                  <p className="text-xs text-gray-500 mt-1">
                    即時利用可。ただしサンプリングと(other)行の制約あり
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Inline contextual help */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">どちらを選ぶか迷ったら</span>
            <ContextualHelpButton step="step3-bq-diagnosis" variant="inline" />
          </div>
        </div>
      )}

      <Button variant="ghost" onClick={onBack}>戻る</Button>
    </div>
  );
}
