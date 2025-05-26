
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import ClientLayoutWrapper from '@/components/layout/client-layout-wrapper';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'よこログ｜YNUsv - シャドウバース対戦記録',
  description: 'シャドウバースの対戦を記録し、戦績を分析しましょう。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={cn(
      "dark",
      GeistSans.variable,
      GeistMono.variable
    )}>
      <body className="antialiased bg-background text-foreground">
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
        <Toaster />
      </body>
    </html>
  );
}
