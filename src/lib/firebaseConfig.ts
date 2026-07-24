/** Firebase クライアント設定の検証ユーティリティ */
export interface ConfigCheck {
  key: string;
  envVar: string;
  value: string | undefined;
  ok: boolean;
}

export function checkFirebaseConfig(): ConfigCheck[] {
  return [
    {
      key:    'API Key',
      envVar: 'NEXT_PUBLIC_FIREBASE_API_KEY',
      value:  process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      ok:     !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    },
    {
      key:    'Auth Domain',
      envVar: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      value:  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      ok:     !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    },
    {
      key:    'Project ID',
      envVar: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      value:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      ok:     !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    {
      key:    'App ID',
      envVar: 'NEXT_PUBLIC_FIREBASE_APP_ID',
      value:  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      ok:     !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
  ];
}

export function allConfigOk(): boolean {
  return checkFirebaseConfig().every(c => c.ok);
}

/** Firebase Auth エラーコードを日本語メッセージに変換 */
export function authErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/unauthorized-domain':        'このドメインはFirebaseの承認済みドメインに登録されていません。Firebase Console → Authentication → Settings → 承認済みドメインにVercelのURLを追加してください。',
    'auth/operation-not-allowed':      'GoogleログインがFirebaseで有効化されていません。Firebase Console → Authentication → Sign-in method → Google を有効にしてください。',
    'auth/invalid-api-key':            'Firebase API Keyが無効です。Vercelの環境変数 NEXT_PUBLIC_FIREBASE_API_KEY を確認してください。',
    'auth/popup-blocked':              'ポップアップがブロックされました。ブラウザのポップアップブロックを解除してください。',
    'auth/popup-closed-by-user':       'ログインがキャンセルされました。',
    'auth/network-request-failed':     'ネットワークエラーが発生しました。接続を確認してください。',
    'auth/too-many-requests':          'リクエストが多すぎます。しばらく待ってから再試行してください。',
    'auth/cancelled-popup-request':    '別のポップアップが開いています。前のポップアップを閉じてください。',
    'auth/internal-error':             'Firebase内部エラーです。ブラウザの開発者ツールのConsoleを確認してください。',
  };
  return map[code] ?? `認証エラー (${code})。ブラウザのConsoleで詳細を確認してください。`;
}
