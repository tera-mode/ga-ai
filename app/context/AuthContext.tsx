'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  /** 期限切れ時にトークンを無音で再取得する */
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

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = buildProvider();
    // prompt: consent で毎回確認（Google の refresh token を取得するため）
    provider.setCustomParameters({ access_type: 'offline', prompt: 'consent' });
    const result = await signInWithPopup(firebaseAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      await storeSession(result.user, credential.accessToken);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
    await fetch('/api/auth/signout', { method: 'POST' });
  }, []);

  /** 期限切れ時の再認証（ポップアップなし / Google セッション存在前提） */
  const refreshGoogleToken = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const provider = buildProvider();
      // prompt なし → Google がセッションを持っていれば無音で完了
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
