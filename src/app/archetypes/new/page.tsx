
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useToast } from "@/hooks/use-toast";
import type { Archetype, GameClass } from "@/types";
import { ALL_GAME_CLASSES } from "@/types";
import { ArchetypeForm } from "@/components/forms/archetype-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { CLASS_ICONS, formatArchetypeNameWithSuffix, getJapaneseClassNameFromValue } from "@/lib/game-data";
import type { MatchData } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonManager } from "@/hooks/useSeasonManager";
import { Card, CardContent as UiCardContent, CardHeader as UiCardHeader, CardTitle as UiCardTitle, CardDescription as UiCardDescription } from "@/components/ui/card";


export default function ManageArchetypesPage() {
  const { archetypes, addArchetype, updateArchetype, deleteArchetype } = useArchetypeManager();
  const { toast } = useToast();
  const { 
    getAllSeasons, 
    isLoadingSeasons,
  } = useSeasonManager();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentArchetype, setCurrentArchetype] = useState<Partial<Archetype> | null>(null);
  const [allMatchesForCounts, setAllMatchesForCounts] = useState<MatchData[]>([]);
  const [discoveredUserKeys, setDiscoveredUserKeys] = useState<string[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);

  useEffect(() => {
    if (isLoadingSeasons) return; 
    setIsLoadingPageData(true);
    const collectedMatches: MatchData[] = [];
    const userLogKeys: string[] = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yokolog_match_logs_')) {
          userLogKeys.push(key);
          try {
            const item = localStorage.getItem(key);
            const userMatches: MatchData[] = item ? JSON.parse(item) : [];
            
            const seasons = getAllSeasons(); 
            const oldestSeason = seasons.length > 0 ? seasons[seasons.length - 1] : null;
            let userMatchesChanged = false;
            const migratedUserMatches = userMatches.map(m => {
                if (!m.seasonId && oldestSeason) {
                  userMatchesChanged = true;
                  return { ...m, seasonId: oldestSeason.id };
                }
                return m;
              });
            if(userMatchesChanged) {
                localStorage.setItem(key, JSON.stringify(migratedUserMatches));
            }
            collectedMatches.push(...migratedUserMatches);
          } catch (e) {
            console.error(`Failed to parse matches for key ${key}:`, e);
          }
        }
      }
    }
    setDiscoveredUserKeys(userLogKeys);
    setAllMatchesForCounts(collectedMatches);
    setIsLoadingPageData(false);
  }, [isLoadingSeasons, getAllSeasons]); 

  const handleAddNew = () => {
    setCurrentArchetype(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (archetype: Archetype) => {
    setCurrentArchetype(archetype);
    setIsDialogOpen(true);
  };

  const handleDelete = (archetypeToDelete: Archetype) => {
    // "unknown" archetype should not be deletable from UI if it were to appear here.
    // However, it's filtered out from the main list, so this is a safeguard.
    if (archetypeToDelete.id === 'unknown') {
      toast({
        title: "エラー",
        description: "「不明な相手」デッキタイプは削除できません。",
        variant: "destructive",
      });
      return;
    }
    try {
      // Find the 'unknown' archetype ID for migrating records.
      const unknownArchetypeId = archetypes.find(a => a.id === 'unknown')?.id || 'unknown';

      // Update logs for all users
      discoveredUserKeys.forEach(userKey => {
        const item = localStorage.getItem(userKey);
        let userMatches: MatchData[] = item ? JSON.parse(item) : [];
        let userMatchesChanged = false;

        const updatedUserMatches = userMatches.map(match => {
          const newMatch = { ...match };
          let changedInThisMatch = false;
          if (match.userArchetypeId === archetypeToDelete.id) {
            newMatch.userArchetypeId = unknownArchetypeId;
            changedInThisMatch = true;
          }
          if (match.opponentArchetypeId === archetypeToDelete.id) {
            newMatch.opponentArchetypeId = unknownArchetypeId;
            changedInThisMatch = true;
          }
          if (changedInThisMatch) {
            userMatchesChanged = true;
          }
          return newMatch;
        });

        if (userMatchesChanged) {
          localStorage.setItem(userKey, JSON.stringify(updatedUserMatches));
        }
      });

      deleteArchetype(archetypeToDelete.id);

      // Update local state for match counts
      const newAllMatchesForCounts = allMatchesForCounts.map(match => {
        let newMatch = { ...match };
        if (match.userArchetypeId === archetypeToDelete.id) newMatch.userArchetypeId = unknownArchetypeId;
        if (match.opponentArchetypeId === archetypeToDelete.id) newMatch.opponentArchetypeId = unknownArchetypeId;
        return newMatch;
      }).filter(match => 
        (match.userArchetypeId !== archetypeToDelete.id && match.opponentArchetypeId !== archetypeToDelete.id) || 
        match.userArchetypeId === unknownArchetypeId || 
        match.opponentArchetypeId === unknownArchetypeId
      );
      setAllMatchesForCounts(newAllMatchesForCounts);


      toast({
        title: "削除完了",
        description: `デッキタイプ「${formatArchetypeNameWithSuffix(archetypeToDelete)}」を削除しました。関連する全ユーザーの対戦記録が更新されました。`,
      });
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "デッキタイプを削除できませんでした。",
        variant: "destructive",
      });
    }
  };

  const handleSubmitForm = (data: { name: string; gameClass: GameClass }) => {
    try {
      if (currentArchetype && currentArchetype.id) {
        // Editing existing archetype (including 'unknown' if it were editable here)
        const updated: Archetype = {
            ...(currentArchetype as Archetype), // Cast is safe here due to currentArchetype.id check
            name: data.name,
            gameClass: data.gameClass,
        };
        updateArchetype(updated);
        toast({
          title: "更新完了",
          description: `「${formatArchetypeNameWithSuffix(updated)}」を更新しました。`,
        });
      } else {
        // Adding new archetype
        const newArchetype = addArchetype(data.name, data.gameClass);
        toast({
          title: "追加完了",
          description: `「${formatArchetypeNameWithSuffix(newArchetype)}」を追加しました。`,
        });
      }
      setIsDialogOpen(false);
      setCurrentArchetype(null);
    } catch (error: any) {
      console.error("デッキタイプの保存に失敗しました:", error);
      toast({
        title: "エラー",
        description: error.message || "デッキタイプを保存できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
    }
  };

  const archetypesByClass = useMemo(() => {
    const grouped: Record<GameClass, Archetype[]> = {} as Record<GameClass, Archetype[]>;
    ALL_GAME_CLASSES.forEach(gc => {
      // Filter out 'unknown' archetype here
      grouped[gc.value] = archetypes
        .filter(arch => arch.id !== 'unknown' && arch.gameClass === gc.value)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    });
    return grouped;
  }, [archetypes]);

  const getMatchCount = (archetypeId: string) => {
    return allMatchesForCounts.filter(match => match.userArchetypeId === archetypeId || match.opponentArchetypeId === archetypeId).length;
  };

  if (isLoadingPageData || isLoadingSeasons) { 
    return (
      <div className="flex flex-1 flex-col">
        <MainHeader
          title="デッキタイプ管理"
          actions={
            <Button onClick={handleAddNew} disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              新規デッキタイプ追加
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto space-y-6">
            {[...Array(3)].map((_, i) => (
              <section key={i} className="mb-8">
                <Skeleton className="h-7 w-1/4 mb-3" /> {/* Class Title Skeleton */}
                <div className="rounded-md border">
                  <Skeleton className="h-10 w-full" /> {/* Table Header Skeleton */}
                  {[...Array(2)].map((_, j) => (
                     <Skeleton key={j} className="h-10 w-full border-t" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }
  
  const userDefinedArchetypesExist = useMemo(() => {
    return archetypes.some(arch => arch.id !== 'unknown');
  }, [archetypes]);

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
            if (!classArchetypes || classArchetypes.length === 0) {
              return null; // Do not render section if no archetypes for this class (excluding 'unknown')
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
                        <TableHead className="text-center">総試合数 (全期間)</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classArchetypes.map((archetype) => (
                        <TableRow key={archetype.id}>
                          <TableCell className="font-medium">{formatArchetypeNameWithSuffix(archetype)}</TableCell>
                          <TableCell className="text-center">{getMatchCount(archetype.id)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(archetype)}
                              className="mr-1 text-primary hover:text-primary/80"
                              title="編集"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" title="削除">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>本当によろしいですか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    この操作は元に戻せません。
                                    「{getJapaneseClassNameFromValue(archetype.gameClass)}」クラスのデッキタイプ
                                    「{formatArchetypeNameWithSuffix(archetype)}」を完全に削除します。
                                    関連する全ユーザーの対戦記録において、このデッキタイプは「不明な相手」として扱われるようになります。
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            );
          })}

           {!userDefinedArchetypesExist && (
              <div className="text-center text-muted-foreground py-8">
                デッキタイプはまだ登録されていません。「新規デッキタイプ追加」ボタンから追加できます。
              </div>
           )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCurrentArchetype(null); // Clear currentArchetype when dialog closes
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentArchetype?.id ? "デッキタイプ編集" : "新規デッキタイプ追加"}</DialogTitle>
            <DialogDescription>
              {currentArchetype?.id ? "デッキタイプの詳細を編集します。" : "新しいデッキタイプを登録します。"}
            </DialogDescription>
          </DialogHeader>
          <ArchetypeForm
            onSubmit={handleSubmitForm}
            initialData={currentArchetype || undefined} // Pass currentArchetype or undefined
            submitButtonText={currentArchetype?.id ? "更新" : "追加"}
            isEditingUnknown={false} // 'unknown' is not editable from this UI flow
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

