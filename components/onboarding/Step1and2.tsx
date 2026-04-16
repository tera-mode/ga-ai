'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ExternalLink, RefreshCw, ChevronRight, BarChart3 } from 'lucide-react';
import type { GCPProject, GA4Property } from '@/types';
import { useAuth } from '@/app/context/AuthContext';

interface Props {
  onNext: (projectId: string, propertyId: string, propertyName: string) => void;
}

export function Step1and2({ onNext }: Props) {
  const { refreshGoogleToken } = useAuth();
  const [projects, setProjects] = useState<GCPProject[]>([]);
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);
  const [errorProperties, setErrorProperties] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<GA4Property | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const fetchProjects = async (isRetry = false) => {
    setLoadingProjects(true);
    setErrorProjects(null);
    try {
      const res = await fetch('/api/ga/projects');
      if (res.status === 401 && !isRetry) {
        const ok = await refreshGoogleToken();
        if (ok) { fetchProjects(true); return; }
        setSessionExpired(true);
        return;
      }
      const data = await res.json() as { projects?: GCPProject[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch projects');
      setProjects(data.projects ?? []);
    } catch (e) {
      setErrorProjects(String(e));
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProperties = async (isRetry = false) => {
    setLoadingProperties(true);
    setErrorProperties(null);
    try {
      const res = await fetch('/api/ga/properties');
      if (res.status === 401 && !isRetry) {
        const ok = await refreshGoogleToken();
        if (ok) { fetchProperties(true); return; }
        setSessionExpired(true);
        return;
      }
      const data = await res.json() as { properties?: GA4Property[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch properties');
      setProperties(data.properties ?? []);
    } catch (e) {
      setErrorProperties(String(e));
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const propNum = (p: GA4Property) => p.name.replace('properties/', '');

  if (sessionExpired) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          セッションが切れました。再度サインインしてください。
        </p>
        <Button
          onClick={async () => {
            setSessionExpired(false);
            const ok = await refreshGoogleToken();
            if (ok) {
              fetchProjects();
              fetchProperties();
            }
          }}
        >
          再サインイン
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">接続設定</h2>
        <p className="mt-1 text-sm text-gray-500">
          GCPプロジェクトとGA4プロパティを選択してください。
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* GCPプロジェクト */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">GCPプロジェクト</h3>
            <button
              onClick={() => fetchProjects()}
              disabled={loadingProjects}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <RefreshCw className="h-3 w-3" /> 更新
            </button>
          </div>
          <p className="text-xs text-gray-400">BigQueryクエリの課金先プロジェクト</p>

          {loadingProjects ? (
            <div className="flex items-center gap-2 py-4 text-gray-400">
              <Spinner className="h-4 w-4" />
              <span className="text-xs">取得中...</span>
            </div>
          ) : errorProjects ? (
            <div className="space-y-2">
              <p className="text-xs text-red-500">{errorProjects}</p>
              <Button variant="outline" size="sm" onClick={() => fetchProjects()}>
                <RefreshCw className="h-3 w-3" /> 再取得
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              アクセスできるプロジェクトが見つかりません。
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 underline"
              >
                GCP Consoleで作成 <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {projects.map((p) => (
                <button
                  key={p.projectId}
                  onClick={() => setSelectedProject(p.projectId)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedProject === p.projectId
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {p.name || p.projectId}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-gray-400">{p.projectId}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GA4プロパティ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">GA4プロパティ</h3>
            <button
              onClick={() => fetchProperties()}
              disabled={loadingProperties}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <RefreshCw className="h-3 w-3" /> 更新
            </button>
          </div>
          <p className="text-xs text-gray-400">分析するGA4プロパティ</p>

          {loadingProperties ? (
            <div className="flex items-center gap-2 py-4 text-gray-400">
              <Spinner className="h-4 w-4" />
              <span className="text-xs">取得中...</span>
            </div>
          ) : errorProperties ? (
            <div className="space-y-2">
              <p className="text-xs text-red-500">{errorProperties}</p>
              <Button variant="outline" size="sm" onClick={() => fetchProperties()}>
                <RefreshCw className="h-3 w-3" /> 再取得
              </Button>
            </div>
          ) : properties.length === 0 ? (
            <p className="py-4 text-xs text-gray-500">
              アクセスできるGA4プロパティが見つかりません。
            </p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {properties.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedProperty(p)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedProperty?.name === p.name
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <BarChart3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {p.displayName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        ID: {propNum(p)} · {p.account}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!selectedProject || !selectedProperty}
        onClick={() => {
          if (selectedProject && selectedProperty) {
            onNext(selectedProject, selectedProperty.name, selectedProperty.displayName);
          }
        }}
      >
        次へ <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
