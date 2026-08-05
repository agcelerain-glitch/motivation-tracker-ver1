import type { Metadata, Viewport } from 'next';
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Roboto_Mono } from 'next/font/google';
import Script from 'next/script';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';

config.autoAddCss = false;

const GA_ID = 'G-KCBKM71RRV';

const shippori = Shippori_Mincho({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-shippori',
  display: 'swap',
});

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-zen-kaku',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  // ── タイトル・説明文（Google検索向け） ───────────────────────
  title: {
    default: 'モチトラ — 今日の半歩',
    template: '%s | モチトラ',
  },
  description:
    '毎日の行動と内面状態を記録して、なぜ続いたか・なぜ続かなかったかを自己分析できるモバイルWebアプリ。達成度・満足度・感情・8つの両極軸スコアを記録し、傾向をグラフで見える化します。',
  keywords: [
    'モチベーション記録', '習慣記録', '自己分析', '行動記録アプリ',
    '日記アプリ', '振り返り', 'セルフモニタリング', 'モチトラ',
  ],
  applicationName: 'モチトラ',
  authors: [{ name: 'モチトラ' }],
  creator: 'モチトラ',
  publisher: 'モチトラ',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },

  // ── ファビコン・アイコン ──────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // ── PWA ─────────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── iOS Safari ホーム画面追加 ─────────────────────────────────
  appleWebApp: {
    capable: true,
    title: 'モチトラ',
    statusBarStyle: 'black-translucent',
  },

  // ── OGP（SNSシェア・Search Console向け） ──────────────────────
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: APP_URL,
    siteName: 'モチトラ',
    title: 'モチトラ — 今日の半歩',
    description:
      '毎日の行動と内面状態を記録して自己分析できるモバイルWebアプリ。達成度・満足度・感情・8軸スコアを記録し、傾向を見える化します。',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'モチトラ アイコン',
      },
    ],
  },

  // ── Twitter/X カード ──────────────────────────────────────────
  twitter: {
    card: 'summary',
    title: 'モチトラ — 今日の半歩',
    description: '毎日の行動と内面状態を記録して自己分析できるモバイルWebアプリ',
    images: ['/android-chrome-512x512.png'],
  },

  // ── その他（Android Chrome / Windows） ───────────────────────
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#16182B',
    'msapplication-TileImage': '/android-chrome-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16182B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${shippori.variable} ${zenKaku.variable} ${robotoMono.variable}`}>
      <body style={{ background: '#16182B', margin: 0, padding: 0 }}>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
