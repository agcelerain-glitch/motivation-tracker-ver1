'use client';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authErrorMessage } from '@/lib/firebaseConfig';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthError('Firebase Auth が初期化されていません。環境変数を確認してください。');
      setLoading(false);
      return;
    }
    try {
      return onAuthStateChanged(
        auth,
        u => {
          setUser(u);
          setLoading(false);
          setAuthError(null);
        },
        err => {
          console.error('[onAuthStateChanged error]', err);
          const code = (err as { code?: string }).code;
          setAuthError(authErrorMessage(code ?? 'unknown'));
          setLoading(false);
        },
      );
    } catch (e) {
      const err = e as { code?: string; message?: string };
      console.error('[Auth init error]', e);
      setAuthError(authErrorMessage(err.code ?? 'unknown'));
      setLoading(false);
    }
  }, []);

  return { user, loading, authError };
}
