"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUsername } from '@/hooks/use-username';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const { username } = useUsername();

  useEffect(() => {
    if (username) {
      router.replace('/log');
    }
  }, [username, router]);

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="yokologへようこそ" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <Card className="w-full">
            <CardHeader className="items-center text-center">
              <Image src="https://placehold.co/120x120.png?text=YK" alt="yokolog ロゴ" width={100} height={100} className="mb-4 rounded-lg" data-ai-hint="logo gaming" />
              <CardTitle className="text-3xl font-bold">yokolog</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                あなたのシャドウバース対戦記録ツール
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-md">
                ユーザー名を設定して、対戦記録と戦績分析を始めましょう。
                既にユーザー名を設定済みの場合は、まもなくリダイレクトされます。
              </p>
              <p className="text-sm text-muted-foreground">
                （リダイレクトされず、ユーザー名を設定済みの場合、ページを更新するかサイドバーから移動してください。）
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link href="/log">マイ対戦記録へ</Link>
                </Button>
                 <Button variant="outline" asChild>
                  <Link href="/matches/new">新規対戦を追加</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
