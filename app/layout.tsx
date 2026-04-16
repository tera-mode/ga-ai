import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GA4 分析エージェント',
  description: '自然言語でGA4データを分析する',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} min-h-full bg-zinc-950`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
