'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart2, Database, Bot, ShieldCheck, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store';
import { useAuth } from '@/app/context/AuthContext';

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { onboardingCompleted } = useOnboardingStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(onboardingCompleted ? '/dashboard' : '/onboarding');
    }
  }, [loading, user, onboardingCompleted, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ナビゲーション */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">GA4 Analytics Agent</span>
          </div>
          <Button variant="outline" size="sm" onClick={signInWithGoogle}>
            サインイン
          </Button>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
          <Bot className="h-3 w-3" /> Powered by Gemini AI
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
          GA4データを、<br />
          <span className="text-blue-600">自然言語で分析する</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          「先月のトップランディングページは？」と聞くだけで、BigQueryのSQLを自動生成・実行・可視化します。
        </p>
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button size="lg" className="px-8 gap-3" onClick={signInWithGoogle}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Googleで無料で始める
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-gray-400">GA4・BigQuery・GCPへのread-onlyアクセスのみ</p>
        </div>
      </section>

      {/* 機能カード */}
      <section className="bg-slate-50 border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Bot className="h-5 w-5 text-blue-600" />,
                bg: 'bg-blue-50',
                title: '自然言語でクエリ',
                desc: 'SQLを書かなくても、日本語で質問するだけでGA4データを分析できます。',
              },
              {
                icon: <Database className="h-5 w-5 text-emerald-600" />,
                bg: 'bg-emerald-50',
                title: 'BigQuery直接クエリ',
                desc: 'サンプリングなし。生データに対してSQL実行。コスト管理も自動です。',
              },
              {
                icon: <BarChart2 className="h-5 w-5 text-violet-600" />,
                bg: 'bg-violet-50',
                title: '自動可視化',
                desc: '棒グラフ・折れ線グラフ・テーブルで結果を即座に可視化します。',
              },
              {
                icon: <ShieldCheck className="h-5 w-5 text-amber-600" />,
                bg: 'bg-amber-50',
                title: 'コスト安全制御',
                desc: 'Dry Run必須・10GBハード上限で、意図しない高額請求を防ぎます。',
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-white border border-gray-100 p-6 shadow-sm">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.bg}`}>
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
