
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useMatchLogger } from "@/hooks/use-match-logger";
import { useToast } from "@/hooks/use-toast";
import type { Archetype, GameClass, GameClassDetail } from "@/types";
import { ALL_GAME_CLASSES } from "@/types";
import { ArchetypeForm } from "@/components/forms/archetype-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit3, Trash2 } from "lucide-react";
import { CLASS_ICONS, formatArchetypeNameWithSuffix, GAME_CLASS_EN_TO_JP } from "@/lib/game-data";

export default function ManageArchetypesPage() {
  const { archetypes, addArchetype, updateArchetype, deleteArchetype } = useArchetypeManager();
  const { matches, updateMatch: updateMatchLogEntry } = useMatchLogger();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentArchetype, setCurrentArchetype] = useState<Partial<Archetype> | null>(null);

  const handleAddNew = () => {
    setCurrentArchetype(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (archetype: Archetype) => {
    setCurrentArchetype(archetype);
    setIsDialogOpen(true);
  };

  const handleDelete = (archetypeToDelete: Archetype) => {
    if (archetypeToDelete.id === 'unknown') {
      toast({
        title: "エラー",
        description: "「不明な相手」デッキタイプは削除できません。",
        variant: "destructive",
      });
      return;
    }
    try {
      // Update related matches before deleting the archetype
      const relatedMatches = matches.filter(
        match => match.userArchetypeId === archetypeToDelete.id || match.opponentArchetypeId === archetypeToDelete.id
      );
      const unknownArchetypeId = archetypes.find(a => a.id === 'unknown')?.id || 'unknown';

      relatedMatches.forEach(match => {
        let changed = false;
        const updatedMatch = { ...match };
        if (match.userArchetypeId === archetypeToDelete.id) {
          updatedMatch.userArchetypeId = unknownArchetypeId;
          changed = true;
        }
        if (match.opponentArchetypeId === archetypeToDelete.id) {
          updatedMatch.opponentArchetypeId = unknownArchetypeId;
          changed = true;
        }
        if (changed) {
          updateMatchLogEntry(updatedMatch);
        }
      });
      
      deleteArchetype(archetypeToDelete.id);
      toast({
        title: "削除完了",
        description: `デッキタイプ「${formatArchetypeNameWithSuffix(archetypeToDelete)}」を削除しました。`,
      });
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "デッキタイプを削除できませんでした。",
        variant: "destructive",
      });
    }
  };

  const handleSubmitForm = (data: { name: string; abbreviation: string; gameClass: GameClass }) => {
    try {
      if (currentArchetype && currentArchetype.id) {
        // Editing existing archetype
        const updated: Archetype = {
            ...currentArchetype, // Preserves ID and isDefault (if any)
            name: data.name,
            abbreviation: data.abbreviation,
            gameClass: data.gameClass,
        } as Archetype; // Type assertion, ID is present
        updateArchetype(updated);
        toast({
          title: "更新完了",
          description: `「${formatArchetypeNameWithSuffix(updated)}」を更新しました。`,
        });
      } else {
        // Adding new archetype
        const newArchetype = addArchetype(data.name, data.abbreviation, data.gameClass);
        toast({
          title: "追加完了",
          description: `「${formatArchetypeNameWithSuffix(newArchetype)}」を追加しました。`,
        });
      }
      setIsDialogOpen(false);
      setCurrentArchetype(null);
    } catch (error) {
      console.error("デッキタイプの保存に失敗しました:", error);
      toast({
        title: "エラー",
        description: "デッキタイプを保存できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  const archetypesByClass = useMemo(() => {
    const grouped: Record<GameClass, Archetype[]> = {} as Record<GameClass, Archetype[]>;
    ALL_GAME_CLASSES.forEach(gc => {
      grouped[gc.value] = archetypes
        .filter(arch => arch.gameClass === gc.value)
        .sort((a, b) => {
          if (a.id === 'unknown') return -1; // Keep 'unknown' at the top if it's in this class (it shouldn't be usually)
          if (b.id === 'unknown') return 1;
          return a.name.localeCompare(b.name, 'ja');
        });
    });
    return grouped;
  }, [archetypes]);

  const getMatchCount = (archetypeId: string) => {
    return matches.filter(match => match.userArchetypeId === archetypeId || match.opponentArchetypeId === archetypeId).length;
  };

  const getJapaneseClassName = (gameClassValue: GameClass): string => {
    const classDetail = ALL_GAME_CLASSES.find(gc => gc.value === gameClassValue);
    return classDetail ? classDetail.label : gameClassValue;
  };

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader
        title="デッキタイプ管理"
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            新規デッキタイプ追加
          </Button>
        }
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {ALL_GAME_CLASSES.map((gameClassDetail) => {
            const classArchetypes = archetypesByClass[gameClassDetail.value];
            // Ensure 'unknown' archetype is handled if it's part of general archetypes list and not a specific class
            const unknownArchetype = archetypes.find(a => a.id === 'unknown');
            let displayArchetypes = classArchetypes;

            if (gameClassDetail.value === archetypes.find(a => a.id === 'unknown')?.gameClass && unknownArchetype && !classArchetypes?.find(a=>a.id === 'unknown')) {
                // Special handling if 'unknown' is filtered into a class but not explicitly there
            }


            if (!displayArchetypes || displayArchetypes.length === 0) {
              // If 'unknown' belongs to this class conceptually but isn't in the filtered list yet, or if it's the only one.
              // This logic might need refinement based on how 'unknown' is classified.
              // For now, we assume 'unknown' might appear under its assigned class if it has one.
              // Or it might be listed separately. Let's assume it appears under its gameClass.
              if (unknownArchetype && unknownArchetype.gameClass === gameClassDetail.value && (!displayArchetypes || displayArchetypes.length === 0)) {
                 // displayArchetypes = [unknownArchetype]; // Only if it's truly the only one for this class
              } else if (!displayArchetypes || displayArchetypes.length === 0) {
                return null;
              }
            }
            const ClassIcon = CLASS_ICONS[gameClassDetail.value];

            return (
              <section key={gameClassDetail.value} className="mb-8">
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  {ClassIcon && <ClassIcon className="mr-2 h-6 w-6 text-primary" />}
                  {gameClassDetail.label}
                </h2>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60%]">デッキタイプ名</TableHead>
                        <TableHead className="text-center">試合数</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayArchetypes.map((archetype) => (
                        <TableRow key={archetype.id}>
                          <TableCell className="font-medium">
                            {formatArchetypeNameWithSuffix(archetype)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getMatchCount(archetype.id)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(archetype)}
                              className="mr-1 text-primary hover:text-primary/80"
                              disabled={archetype.id === 'unknown'} // ID 'unknown' itself cannot be changed, but its properties can be. Here, disabling edit for 'unknown' for simplicity but form should handle it.
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {archetype.id !== 'unknown' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>本当によろしいですか？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      この操作は元に戻せません。
                                      「{getJapaneseClassName(archetype.gameClass)}」クラスのデッキタイプ
                                      「{formatArchetypeNameWithSuffix(archetype)}」を完全に削除します。
                                      関連する対戦記録のデッキタイプは「不明」として扱われるようになります。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(archetype)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      削除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                             {archetype.id === 'unknown' && (
                                 <span className="text-xs text-muted-foreground italic mr-2">削除不可</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {displayArchetypes.length === 0 && (
                        <TableCaption>このクラスのデッキタイプはまだ登録されていません。</TableCaption>
                    )}
                  </Table>
                </div>
              </section>
            );
          })}
           {/* Special section for the 'unknown' archetype if it's not naturally listed or to ensure it's always manageable */}
           {(() => {
             const unknownArchetype = archetypes.find(a => a.id === 'unknown');
             if (unknownArchetype && !ALL_GAME_CLASSES.some(gc => gc.value === unknownArchetype.gameClass && archetypesByClass[gc.value]?.some(a => a.id === 'unknown'))) {
               const ClassIcon = CLASS_ICONS[unknownArchetype.gameClass];
               return (
                 <section key="unknown-section" className="mb-8">
                   <h2 className="text-xl font-semibold mb-3 flex items-center">
                     {ClassIcon && <ClassIcon className="mr-2 h-6 w-6 text-primary" />}
                     その他 (不明な相手)
                   </h2>
                   <div className="rounded-md border">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead className="w-[60%]">デッキタイプ名</TableHead>
                           <TableHead className="text-center">試合数</TableHead>
                           <TableHead className="text-right">操作</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         <TableRow key={unknownArchetype.id}>
                           <TableCell className="font-medium">
                             {formatArchetypeNameWithSuffix(unknownArchetype)}
                           </TableCell>
                           <TableCell className="text-center">
                             {getMatchCount(unknownArchetype.id)}
                           </TableCell>
                           <TableCell className="text-right">
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleEdit(unknownArchetype)}
                               className="mr-1 text-primary hover:text-primary/80"
                             >
                               <Edit3 className="h-4 w-4" />
                             </Button>
                             <span className="text-xs text-muted-foreground italic mr-2">削除不可</span>
                           </TableCell>
                         </TableRow>
                       </TableBody>
                     </Table>
                   </div>
                 </section>
               );
             }
             return null;
           })()}

           {archetypes.filter(a => a.id !== 'unknown').length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                「不明な相手」以外のデッキタイプはまだ登録されていません。「新規デッキタイプ追加」ボタンから追加できます。
              </div>
           )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCurrentArchetype(null); // Reset when dialog closes
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentArchetype?.id ? "デッキタイプ編集" : "新規デッキタイプ追加"}</DialogTitle>
            <DialogDescription>
              {currentArchetype?.id ? "デッキタイプの詳細を編集します。" : "新しいデッキタイプを登録します。"}
              {currentArchetype?.id === 'unknown' && " 「不明な相手」のIDは変更できませんが、名前とクラスは変更可能です。"}
            </DialogDescription>
          </DialogHeader>
          <ArchetypeForm
            onSubmit={handleSubmitForm}
            initialData={currentArchetype || undefined} 
            submitButtonText={currentArchetype?.id ? "更新" : "追加"}
            isEditingUnknown={currentArchetype?.id === 'unknown'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
    

    