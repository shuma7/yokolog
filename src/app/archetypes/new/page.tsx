"use client";

import { ArchetypeForm } from "@/components/forms/archetype-form";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useToast } from "@/hooks/use-toast";
import type { GameClass }okalistedArchetype } from "@/types";

export default function AddArchetypePage() {
  const { addArchetype } = useArchetypeManager();
  const { toast } = useToast();

  const handleSubmit = (data: { name: string; abbreviation: string; gameClass: GameClass }) => {
    try {
      const newArchetype = addArchetype(data.name, data.abbreviation, data.gameClass);
      toast({
        title: "デッキタイプ追加完了",
        description: `「${newArchetype.name}」を正常に追加しました。`,
      });
    } catch (error) {
      console.error("デッキタイプの追加に失敗しました:", error);
      toast({
        title: "エラー",
        description: "デッキタイプを追加できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader title="新規デッキタイプ提案" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <ArchetypeForm onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}
