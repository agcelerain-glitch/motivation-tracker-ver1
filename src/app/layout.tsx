import type { Metadata, Viewport } from 'next';
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Roboto_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'モチトラ — 今日の半歩',
  description: '日々の行動と内面状態を記録し、自己分析できるモバイルWebアプリ',
  manifest: '/manifest.json',
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
