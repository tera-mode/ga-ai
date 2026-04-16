'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

// Google API アクセスに必要なスコープ
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/bigquery.readonly',
  'https://www.googleapis.com/auth/cloud-platform.read-only',
];

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** 期限切れ時にトークンを再取得してセッションを更新する */
  refreshGoogleToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  GOOGLE_SCOPES.forEach((s) => provider.addScope(s));
  return provider;
}

async function storeSession(user: User, accessToken: string): Promise<void> {
  await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: user.uid, email: user.email, googleAccessToken: accessToken }),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * signInWithGoogle が storeSession を完了させるまで loading を true に保つフラグ。
   * onAuthStateChanged → redirect のレースコンディションを防ぐ。
   */
  const sessionPending = useRef(false);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      // signInWithGoogle の storeSession が完了してから loading を解除する
      if (!sessionPending.current) {
        setLoading(false);
      }
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    sessionPending.current = true;
    setLoading(true);
    try {
      const provider = buildProvider();
      provider.setCustomParameters({ access_type: 'offline', prompt: 'consent' });
      const result = await signInWithPopup(firebaseAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await storeSession(result.user, credential.accessToken);
      }
    } finally {
      sessionPending.current = false;
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
    await fetch('/api/auth/signout', { method: 'POST' });
  }, []);

  /**
   * セッションが期限切れの場合に Google トークンを再取得してセッション cookie を更新する。
   * Google のセッションが残っていれば popup が自動クローズされる。
   */
  const refreshGoogleToken = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const provider = buildProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await storeSession(result.user, credential.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, refreshGoogleToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
