
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MainHeader } from "@/components/layout/main-header";
import { useArchetypeManager } from "@/hooks/use-archetype-manager";
import { useToast } from "@/hooks/use-toast";
import type { Archetype, GameClass, MatchData } from "@/types"; // Added MatchData
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
import { Skeleton } from "@/components/ui/skeleton";
// Firestore imports
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";


export default function ManageArchetypesPage() {
  const { archetypes, addArchetype, updateArchetype, deleteArchetype: deleteArchetypeDefinition, isLoadingArchetypes } = useArchetypeManager();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentArchetype, setCurrentArchetype] = useState<Partial<Archetype> | null>(null);
  const [allMatchesForCounts, setAllMatchesForCounts] = useState<MatchData[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true); // For match counts loading

  useEffect(() => {
    // Fetch all matches from all users for accurate counts
    // This is a simplified version. In a real app with many users/matches,
    // this could be slow and might need aggregated counts from a backend.
    if (isLoadingArchetypes) return; // Wait for archetypes to load first

    setIsLoadingPageData(true);
    const fetchAllMatches = async () => {
      if (!db || Object.keys(db).length === 0) {
          console.warn("Firestore is not initialized. Cannot fetch match counts.");
          setAllMatchesForCounts([]);
          setIsLoadingPageData(false);
          return;
      }
      const matchesCollectionRef = collection(db, 'matches');
      try {
        const querySnapshot = await getDocs(matchesCollectionRef);
        const collectedMatches: MatchData[] = [];
        querySnapshot.forEach((doc) => {
          collectedMatches.push({ id: doc.id, ...doc.data() } as MatchData);
        });
        setAllMatchesForCounts(collectedMatches);
      } catch (error) {
        console.error("Error fetching all matches for counts:", error);
        toast({ title: "エラー", description: "試合数の取得に失敗しました。", variant: "destructive" });
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchAllMatches();
  }, [isLoadingArchetypes, toast]);

  const handleAddNew = useCallback(() => {
    setCurrentArchetype(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((archetype: Archetype) => {
    setCurrentArchetype(archetype);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (archetypeToDelete: Archetype) => {
    if (archetypeToDelete.id === 'unknown') {
      toast({
        title: "エラー",
        description: "「不明な相手」デッキタイプは削除できません。",
        variant: "destructive",
      });
      return;
    }
    try {
      // Get the 'unknown' archetype's ID (should be stable 'unknown')
      const unknownArchetypeId = 'unknown'; 

      // Update match logs in Firestore
      if (db && Object.keys(db).length !== 0) {
        const matchesRef = collection(db, "matches");
        const qUser = query(matchesRef, where("userArchetypeId", "==", archetypeToDelete.id));
        const qOpponent = query(matchesRef, where("opponentArchetypeId", "==", archetypeToDelete.id));

        const userMatchesSnapshot = await getDocs(qUser);
        const opponentMatchesSnapshot = await getDocs(qOpponent);

        const batch = writeBatch(db);
        let changesMade = false;

        userMatchesSnapshot.forEach(docSnap => {
          batch.update(docSnap.ref, { userArchetypeId: unknownArchetypeId });
          changesMade = true;
        });
        opponentMatchesSnapshot.forEach(docSnap => {
          batch.update(docSnap.ref, { opponentArchetypeId: unknownArchetypeId });
          changesMade = true;
        });
        
        if (changesMade) {
          await batch.commit();
          toast({
            title: "対戦記録更新",
            description: `関連する対戦記録のデッキタイプが「${formatArchetypeNameWithSuffix(archetypes.find(a=>a.id === unknownArchetypeId) || {id:'unknown', name:'不明な相手', gameClass: 'Forestcraft'})}」に更新されました。`,
          });
           // Refetch match counts
           const querySnapshot = await getDocs(collection(db, 'matches'));
           const collectedMatches: MatchData[] = [];
           querySnapshot.forEach((doc) => {
             collectedMatches.push({ id: doc.id, ...doc.data() } as MatchData);
           });
           setAllMatchesForCounts(collectedMatches);
        }
      }
      
      // Delete the archetype definition
      await deleteArchetypeDefinition(archetypeToDelete.id);
      // Archetypes state will update via onSnapshot from useArchetypeManager
      // Match counts UI will update based on the new allMatchesForCounts

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
  }, [archetypes, deleteArchetypeDefinition, toast]);

  const handleSubmitForm = useCallback(async (data: { name: string; gameClass: GameClass }) => {
    try {
      if (currentArchetype && currentArchetype.id) {
        const updated: Archetype = {
            ...(currentArchetype as Archetype), // Cast is okay as we check id
            name: data.name,
            gameClass: data.gameClass,
        };
        await updateArchetype(updated); // This is now async
        toast({
          title: "更新完了",
          description: `「${formatArchetypeNameWithSuffix(updated)}」を更新しました。`,
        });
      } else {
        const newArchetype = await addArchetype(data.name, data.gameClass); // This is now async
        if (newArchetype) {
          toast({
            title: "追加完了",
            description: `「${formatArchetypeNameWithSuffix(newArchetype)}」を追加しました。`,
          });
        }
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
  }, [currentArchetype, updateArchetype, addArchetype, toast]);

  const archetypesByClass = useMemo(() => {
    const grouped: Record<GameClass, Archetype[]> = {} as Record<GameClass, Archetype[]>;
    ALL_GAME_CLASSES.forEach(gc => {
      grouped[gc.value] = archetypes
        .filter(arch => arch.id !== 'unknown' && arch.gameClass === gc.value)
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    });
    return grouped;
  }, [archetypes]);

  const getMatchCount = useCallback((archetypeId: string) => {
    return allMatchesForCounts.filter(match => match.userArchetypeId === archetypeId || match.opponentArchetypeId === archetypeId).length;
  }, [allMatchesForCounts]);

  const userDefinedArchetypesExist = useMemo(() => {
    if (isLoadingArchetypes) return true; // Assume true while loading to prevent flicker
    return archetypes.some(arch => arch.id !== 'unknown' && !arch.isDefault);
  }, [archetypes, isLoadingArchetypes]);


  if (isLoadingArchetypes || isLoadingPageData) {
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
                <Skeleton className="h-7 w-1/4 mb-3" />
                <div className="rounded-md border">
                  <Skeleton className="h-10 w-full" />
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
              return null;
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
                              disabled={archetype.id === 'unknown'}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive/80"
                                  title="削除"
                                  disabled={archetype.id === 'unknown'}
                                >
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
            {/* Display 'unknown' archetype separately if needed, or handle its display elsewhere */}
            {archetypes.find(a => a.id === 'unknown') && !Object.values(archetypesByClass).flat().some(a => a.id === 'unknown') && (
              <section key="unknown-section" className="mb-8">
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  {CLASS_ICONS.Forestcraft && <CLASS_ICONS.Forestcraft className="mr-2 h-6 w-6 text-muted-foreground" />} {/* Example Icon */}
                  その他 (不明な相手など)
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
                        {archetypes.filter(a => a.id === 'unknown').map(archetype => (
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
                                <Button variant="ghost" size="icon" disabled className="text-muted-foreground" title="削除不可">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
              </section>
            )}

           {!isLoadingArchetypes && !userDefinedArchetypesExist && Object.values(archetypesByClass).every(arr => arr.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                「不明な相手」以外のデッキタイプはまだ登録されていません。「新規デッキタイプ追加」ボタンから追加できます。
              </div>
           )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCurrentArchetype(null);
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentArchetype?.id ? "デッキタイプ編集" : "新規デッキタイプ追加"}</DialogTitle>
            <DialogDescription>
              {currentArchetype?.id ? (currentArchetype.id === 'unknown' ? "「不明な相手」デッキタイプを編集します。IDは変更できません。" : "デッキタイプの詳細を編集します。") : "新しいデッキタイプを登録します。"}
            </DialogDescription>
          </DialogHeader>
          <ArchetypeForm
            onSubmit={handleSubmitForm}
            initialData={currentArchetype || undefined} // Pass full currentArchetype or undefined
            submitButtonText={currentArchetype?.id ? "更新" : "追加"}
            isEditingUnknown={currentArchetype?.id === 'unknown'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
