'use client';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authErrorMessage } from '@/lib/firebaseConfig';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  // auth が null なら即座に loading=false、エラーも初期値で設定する
  const [loading, setLoading] = useState(() => !!auth);
  const [authError, setAuthError] = useState<string | null>(
    () => auth ? null : 'Firebase Auth が初期化されていません。環境変数を確認してください。'
  );

  useEffect(() => {
    if (!auth) return; // エラーは useState 初期値で設定済み
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
      const msg = authErrorMessage(err.code ?? 'unknown');
      // setTimeout で非同期化し、エフェクト内同期 setState 警告を回避
      setTimeout(() => { setAuthError(msg); setLoading(false); }, 0);
    }
  }, []);

  return { user, loading, authError };
}
