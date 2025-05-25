"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from 'lucide-react';

interface UsernameModalProps {
  onUsernameSet: (username: string) => void;
}

export function UsernameModal({ onUsernameSet }: UsernameModalProps) {
  const [inputUsername, setInputUsername] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      onUsernameSet(inputUsername.trim());
    }
  };

  if (!isVisible) {
    return null; 
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">yokologへようこそ！</CardTitle>
          <CardDescription>続けるにはユーザー名を入力してください。これは対戦データをローカルに保存するために使用されます。</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="ユーザー名を入力"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                required
                className="text-base"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!inputUsername.trim()}>
              ユーザー名を保存
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
