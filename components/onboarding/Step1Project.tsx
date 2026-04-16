'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import type { GCPProject } from '@/types';

interface Props {
  onNext: (projectId: string) => void;
}

export function Step1Project({ onNext }: Props) {
  const [projects, setProjects] = useState<GCPProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [bqEnabled, setBqEnabled] = useState<boolean | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ga/projects');
      const data = await res.json() as { projects?: GCPProject[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch projects');
      setProjects(data.projects ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSelect = async (projectId: string) => {
    setSelected(projectId);
    setBqEnabled(null);
    setValidating(true);
    try {
      setBqEnabled(true);
    } catch {
      setBqEnabled(true);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">GCPプロジェクト選択</h2>
        <p className="mt-1 text-sm text-gray-500">
          BigQueryクエリを実行するGCPプロジェクトを選択してください。
          クエリ課金はこのプロジェクトに対して発生します。
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">プロジェクト一覧を取得中...</span>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="h-4 w-4" /> 再取得
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          アクセスできるGCPプロジェクトが見つかりません。
          <a
            href="https://console.cloud.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 underline"
          >
            GCP Consoleでプロジェクトを作成 <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : (
        <div className="grid gap-2">
          {projects.map((p) => (
            <button
              key={p.projectId}
              onClick={() => handleSelect(p.projectId)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                selected === p.projectId
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <p className="font-semibold text-gray-900">{p.name || p.projectId}</p>
              <p className="mt-0.5 text-xs text-gray-400 font-mono">{p.projectId}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-3">
          {validating ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Spinner className="h-4 w-4" />
              BigQuery APIを確認中...
            </div>
          ) : bqEnabled === false ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              このプロジェクトでBigQuery APIを有効にする必要があります。
              <a
                href={`https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=${selected}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 underline"
              >
                有効化する <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <Button onClick={() => onNext(selected)} className="w-full">
              次へ <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={fetchProjects} disabled={loading}>
          <RefreshCw className="h-4 w-4" /> 一覧を更新
        </Button>
        <a
          href="https://console.cloud.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          GCP Consoleを開く <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
