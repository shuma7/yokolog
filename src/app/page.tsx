"use client"; // This page needs to be a client component for potential redirection or dynamic content based on username

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
    // ClientLayoutWrapper handles the initial username check and modal.
    // If username is set, we can proceed to the main content or redirect.
    // For now, we assume user is already on the desired page or will be shown modal.
    // If user lands here and has username, redirect to log.
    if (username) {
      router.replace('/log');
    }
  }, [username, router]);

  // This content will effectively be shown only if the username is NOT set,
  // because ClientLayoutWrapper will show the UsernameModal.
  // However, if a user somehow bypasses that or if username gets cleared,
  // this page provides a fallback. Or if ClientLayoutWrapper logic changes.
  // For now, the primary purpose is to exist as the root page.
  // If username becomes set, useEffect above will redirect.

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="Welcome to yokolog" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <Card className="w-full">
            <CardHeader className="items-center text-center">
              <Image src="https://placehold.co/120x120.png?text=YK" alt="yokolog Logo" width={100} height={100} className="mb-4 rounded-lg" data-ai-hint="logo gaming" />
              <CardTitle className="text-3xl font-bold">yokolog</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Your Personal Shadowverse Match Tracker
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-md">
                Please set your username to begin tracking your matches and analyzing your performance.
                If you've already set a username, you should be redirected shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                (If you are not redirected, and you have set a username, please try refreshing or navigating via the sidebar.)
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link href="/log">Go to My Log</Link>
                </Button>
                 <Button variant="outline" asChild>
                  <Link href="/matches/new">Add New Match</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
