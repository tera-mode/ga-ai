'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import type { BQDiagnostic } from '@/types';

interface Props {
  propertyId: string;
  projectId: string;
  onLinked: (dataset: string, bqProjectId: string) => void;
  onFallback: () => void;
  onBack: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
    >
      {copied ? <><Check className="h-3 w-3 text-emerald-500" /> コピー済み</> : <><Copy className="h-3 w-3" /> コピー</>}
    </button>
  );
}

export function Step3aSetupGuide({ propertyId, projectId, onLinked, onFallback, onBack }: Props) {
  const propNum = propertyId.replace('properties/', '');
  const ga4AdminUrl = `https://analytics.google.com/analytics/web/#/a/${propNum}p${propNum}/admin/`;

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'pending' | 'success' | 'fail'>('pending');

  const checkLink = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/ga/bq-link?propertyId=${encodeURIComponent(propertyId)}`);
      const data = await res.json() as BQDiagnostic & { error?: string };
      if (data.linked && data.dataset && data.projectId) {
        setCheckResult('success');
        setTimeout(() => onLinked(data.dataset!, data.projectId!), 1000);
      } else {
        setCheckResult('fail');
      }
    } catch {
      setCheckResult('fail');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">BigQuery Export 設定ガイド</h2>
        <p className="mt-1 text-sm text-gray-500">約3〜5分で完了します</p>
      </div>

      {/* Step 1 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
          GCPプロジェクトの確認
        </h3>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            <span>プロジェクト</span>
            <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs text-gray-700">{projectId}</code>
            <span>を確認済み</span>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
          GA4でBigQueryリンクを作成
        </h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            <a
              href={ga4AdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              GA4管理画面を開く <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>「プロダクトリンク」→「BigQueryリンク」をクリック</li>
          <li>「リンク」をクリック</li>
          <li>
            プロジェクト ID を入力：
            <code className="ml-2 bg-white border border-gray-200 px-2 py-0.5 rounded text-xs text-gray-700">{projectId}</code>
            <CopyButton text={projectId} />
          </li>
          <li>
            データロケーション: 「Tokyo (asia-northeast1)」推奨{' '}
            <a href="/faq#data-location" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
              Tokyoで大丈夫？
            </a>
          </li>
          <li>
            頻度: 「日次」+「ストリーミング」両方ON推奨{' '}
            <a href="/faq#streaming-vs-daily" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
              ストリーミングは必要？
            </a>
          </li>
          <li>「送信」をクリックして保存</li>
        </ol>
      </div>

      {/* Step 3 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
          リンクの確認
        </h3>
        <p className="text-sm text-gray-500">
          設定が完了したら下のボタンで確認してください。
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={checkLink} disabled={checking} size="sm">
            {checking ? <><Spinner className="h-4 w-4" /> 確認中...</> : '完了したので確認する'}
          </Button>
          {checkResult === 'success' && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" /> リンクが作成されました！
            </span>
          )}
          {checkResult === 'fail' && (
            <span className="text-sm text-amber-600">
              まだ確認できません。設定後しばらく待ってから再確認してください。
            </span>
          )}
        </div>
      </div>

      {/* Step 4 */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">4</span>
          データ到着待ち
        </h3>
        <p className="text-sm text-gray-500">
          初回エクスポートは通常24〜48時間かかります。今すぐ始める場合はData API経由でお試しください。
        </p>
        <Button variant="outline" size="sm" onClick={onFallback}>
          暫定的にData APIで分析を始める
        </Button>
      </div>

      <Button variant="ghost" onClick={onBack}>戻る</Button>
    </div>
  );
}
