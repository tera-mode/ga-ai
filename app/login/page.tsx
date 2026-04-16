'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
      // AuthContext の onAuthStateChanged → useEffect が push する
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // ポップアップを閉じた場合は無視
      if (!msg.includes('popup-closed') && !msg.includes('cancelled')) {
        setError('サインインに失敗しました。もう一度お試しください。');
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 左パネル（ブランディング） */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <BarChart2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">GA4 Analytics Agent</span>
        </div>
        <div>
          <blockquote className="text-2xl font-medium text-white leading-relaxed">
            「先月のトップランディングページは？」<br />
            <span className="text-gray-400">— 自然言語でBigQueryを動かす</span>
          </blockquote>
          <p className="mt-6 text-sm text-gray-500">
            GA4・BigQuery・GCPへのread-onlyアクセスのみ使用します
          </p>
        </div>
      </div>

      {/* 右パネル（サインイン） */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">GA4 Analytics Agent</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>
          <p className="mt-2 text-sm text-gray-500">
            GA4プロパティとBigQueryへのアクセスが必要です
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <Button
              className="w-full gap-3"
              size="lg"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Googleアカウントでサインイン
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            続行することで、利用規約とプライバシーポリシーに同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  );
}
