import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  type SupportedLocale,
} from '@strike/shared-i18n';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: {
    default: 'Strike - Cloud Gaming. Instant. Social.',
    template: '%s | Strike',
  },
  description:
    'Play any game, anywhere, instantly. No downloads. No waiting. Share your epic gaming moments with TikTok-style Reels.',
  keywords: [
    'cloud gaming',
    'gaming',
    'streaming',
    'reels',
    'gaming community',
    'instant gaming',
  ],
  authors: [{ name: 'Strike' }],
  creator: 'Strike',
  publisher: 'Strike',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://strike.gg'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      it: '/it',
      fr: '/fr',
      es: '/es',
      de: '/de',
      pt: '/pt',
      ko: '/ko',
      th: '/th',
      tr: '/tr',
      pl: '/pl',
      ar: '/ar',
      id: '/id',
      vi: '/vi',
      tl: '/tl',
      ru: '/ru',
      zh: '/zh',
      ja: '/ja',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Strike',
    title: 'Strike - Cloud Gaming. Instant. Social.',
    description:
      'Play any game, anywhere, instantly. No downloads. No waiting.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Strike Cloud Gaming',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strike - Cloud Gaming. Instant. Social.',
    description:
      'Play any game, anywhere, instantly. No downloads. No waiting.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = (await params) ?? {};
  const locale = (resolvedParams.locale ?? DEFAULT_LOCALE) as SupportedLocale;
  const dir = getLocaleDirection(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

