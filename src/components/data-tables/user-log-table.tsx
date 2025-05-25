
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, EyeOff } from "lucide-react";
import type { MatchData, Archetype, GameClassNameMap } from "@/types";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from "@/lib/game-data";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


interface UserLogTableProps {
  matches: MatchData[];
  archetypes: Archetype[];
  onDeleteMatch: (matchId: string) => void;
  onEditRequest: (match: MatchData) => void;
  gameClassMapping: GameClassNameMap;
  isReadOnly?: boolean;
  isMinimal?: boolean;
}

export function UserLogTable({
  matches,
  archetypes,
  onDeleteMatch,
  onEditRequest,
  gameClassMapping,
  isReadOnly = false,
  isMinimal = false
}: UserLogTableProps) {
  const getArchetypeDetails = (archetypeId: string): Archetype | undefined => {
    return archetypes.find(a => a.id === archetypeId);
  };

  const getResultText = (result: "win" | "loss") => {
    switch (result) {
      case "win": return "勝利";
      case "loss": return "敗北";
      default: return result;
    }
  };

  const getTurnText = (turn: "first" | "second" | "unknown") => {
    switch (turn) {
      case "first": return "先攻";
      case "second": return "後攻";
      case "unknown": return "不明";
      default: return turn;
    }
  };

  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">まだ対戦記録がありません。</p>;
  }

  const totalMatches = matches.length;

  // Define styles based on isMinimal prop
  const cellPaddingY = isMinimal ? 'py-0' : 'py-0';
  const cellPaddingX = isMinimal ? 'px-1' : 'px-2'; 
  
  const fontSize = isMinimal ? 'text-[10px]' : 'text-sm';
  const headerHeight = isMinimal ? 'h-auto' : 'h-auto';
  const headerPaddingY = isMinimal ? 'py-0.5' : 'py-0';
  const headerPaddingX = isMinimal ? 'px-1' : 'px-2';
  const headerFontSize = isMinimal ? 'text-[10px]' : 'text-sm';

  const cellIconSize = isMinimal ? 'h-3 w-3' : 'h-3 w-3'; 
  const actionIconSize = isMinimal ? 'h-3 w-3' : 'h-3 w-3'; 

  const actionButtonBaseClasses = "variant=\"ghost\"";
  const actionButtonSizeClasses = isMinimal
    ? "p-0.5 h-5 w-5 flex items-center justify-center" 
    : "p-0.5 h-5 w-5 flex items-center justify-center"; 

  const badgeBaseClasses = "capitalize";
  const badgeStyleClasses = isMinimal
    ? "px-1 py-0 text-[9px] leading-tight"
    : "px-1.5 py-0 text-[11px] leading-tight"; 

  const tableCellTextClasses = isMinimal ? "" : "leading-tight"; 

  return (
    <TooltipProvider>
      <div className="rounded-lg border overflow-x-auto relative">
        <Table className={fontSize}>
          <TableHeader>
            <TableRow>
              <TableHead className={cn("sticky top-0 bg-card z-10 w-[40px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>番号</TableHead>
              <TableHead className={cn("sticky top-0 bg-card z-10 min-w-[60px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>自分のデッキ</TableHead>
              <TableHead className={cn("sticky top-0 bg-card z-10 min-w-[60px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>相手のデッキ</TableHead>
              <TableHead className={cn("sticky top-0 bg-card z-10 w-[50px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>先後</TableHead>
              <TableHead className={cn("sticky top-0 bg-card z-10 w-[60px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>勝敗</TableHead>
              <TableHead className={cn("sticky top-0 bg-card z-10 min-w-[440px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>メモ</TableHead>
              <TableHead className={cn("sticky top-0 bg-card z-10 text-right w-[70px]", headerHeight, headerPaddingY, headerPaddingX, headerFontSize, tableCellTextClasses)}>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match, index) => {
              const userArchetype = getArchetypeDetails(match.userArchetypeId);
              const opponentArchetype = getArchetypeDetails(match.opponentArchetypeId);

              const UserIcon = userArchetype?.id === 'unknown'
                ? UNKNOWN_ARCHETYPE_ICON
                : (userArchetype ? CLASS_ICONS[userArchetype.gameClass] || GENERIC_ARCHETYPE_ICON : GENERIC_ARCHETYPE_ICON);

              const OpponentIcon = opponentArchetype?.id === 'unknown'
                ? UNKNOWN_ARCHETYPE_ICON
                : (opponentArchetype ? CLASS_ICONS[opponentArchetype.gameClass] || GENERIC_ARCHETYPE_ICON : GENERIC_ARCHETYPE_ICON);

              const matchNumber = totalMatches - index;

              return (
                <TableRow key={match.id} className="hover:bg-muted/50">
                  <TableCell className={cn(cellPaddingY, cellPaddingX, tableCellTextClasses)}>{matchNumber}</TableCell>
                  <TableCell className={cn(cellPaddingY, cellPaddingX, tableCellTextClasses)}>
                    <div className="flex items-center gap-1">
                      <UserIcon className={cn(cellIconSize, "text-muted-foreground")} />
                      {userArchetype ? formatArchetypeNameWithSuffix(userArchetype) : '不明'}
                    </div>
                  </TableCell>
                  <TableCell className={cn(cellPaddingY, cellPaddingX, tableCellTextClasses)}>
                    <div className="flex items-center gap-1">
                      <OpponentIcon className={cn(cellIconSize, "text-muted-foreground")} />
                      {opponentArchetype ? formatArchetypeNameWithSuffix(opponentArchetype) : '不明'}
                    </div>
                  </TableCell>
                  <TableCell className={cn(cellPaddingY, cellPaddingX, tableCellTextClasses)}>{getTurnText(match.turn)}</TableCell>
                  <TableCell className={cn(cellPaddingY, cellPaddingX, tableCellTextClasses)}>
                    <Badge variant={match.result === 'win' ? 'default' : 'destructive'}
                          className={cn(badgeBaseClasses, badgeStyleClasses,
                                      match.result === 'win' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white')}>
                      {getResultText(match.result)}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("max-w-[440px] truncate", cellPaddingY, cellPaddingX, tableCellTextClasses)} title={match.notes || undefined}>{match.notes || '-'}</TableCell>
                  <TableCell className={cn("text-right", cellPaddingY, cellPaddingX, tableCellTextClasses)}>
                    {isReadOnly ? (
                       <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className={cn("text-muted-foreground cursor-not-allowed", actionButtonSizeClasses)} disabled>
                                <EyeOff className={actionIconSize} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>他のユーザーのログは編集/削除できません</p>
                        </TooltipContent>
                       </Tooltip>
                    ) : (
                      <>
                        <Button variant="ghost" className={cn("text-primary hover:text-primary/80 mr-0.5", actionButtonSizeClasses)} onClick={() => onEditRequest(match)}>
                          <Edit3 className={actionIconSize} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className={cn("text-destructive hover:text-destructive/80", actionButtonSizeClasses)}>
                              <Trash2 className={actionIconSize} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>本当によろしいですか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は元に戻せません。この対戦記録を完全に削除します。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteMatch(match.id)} className="bg-destructive hover:bg-destructive/90">
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
