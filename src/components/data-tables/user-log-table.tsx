
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
import { Trash2, Edit3 } from "lucide-react";
import type { MatchData, Archetype, GameClassNameMap } from "@/types";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON } from "@/lib/game-data";
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

interface UserLogTableProps {
  matches: MatchData[]; // Expected to be sorted newest first for display
  archetypes: Archetype[];
  onDeleteMatch: (matchId: string) => void;
  onEditRequest: (match: MatchData) => void;
  gameClassMapping: GameClassNameMap;
}

export function UserLogTable({ matches, archetypes, onDeleteMatch, onEditRequest, gameClassMapping }: UserLogTableProps) {
  const getArchetypeDetails = (archetypeId: string): Archetype | undefined => {
    return archetypes.find(a => a.id === archetypeId);
  };

  const getResultText = (result: "win" | "loss") => { // Removed "draw"
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
    return <p className="text-center text-muted-foreground py-8">まだ対戦記録がありません。いくつか追加してみましょう！</p>;
  }

  const totalMatches = matches.length;

  return (
    <div className="rounded-lg border overflow-x-auto relative max-h-[calc(100vh-250px)]"> {/* Adjust max-h as needed */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky top-0 bg-card z-10 w-[80px]">番号</TableHead>
            <TableHead className="sticky top-0 bg-card z-10 min-w-[180px]">自分のデッキタイプ</TableHead>
            <TableHead className="sticky top-0 bg-card z-10 min-w-[180px]">相手のデッキタイプ</TableHead>
            <TableHead className="sticky top-0 bg-card z-10 w-[80px]">先後</TableHead>
            <TableHead className="sticky top-0 bg-card z-10 w-[80px]">勝敗</TableHead>
            <TableHead className="sticky top-0 bg-card z-10 min-w-[200px]">メモ</TableHead>
            <TableHead className="sticky top-0 bg-card z-10 text-right w-[120px]">操作</TableHead>
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
                <TableCell>{matchNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {userArchetype ? `${userArchetype.name} (${userArchetype.abbreviation})` : '不明'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OpponentIcon className="h-4 w-4 text-muted-foreground" />
                    {opponentArchetype ? `${opponentArchetype.name} (${opponentArchetype.abbreviation})` : '不明'}
                  </div>
                </TableCell>
                <TableCell>{getTurnText(match.turn)}</TableCell>
                <TableCell>
                  <Badge variant={match.result === 'win' ? 'default' : 'destructive'} // Removed 'secondary' for draw
                         className={`capitalize ${match.result === 'win' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {getResultText(match.result)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={match.notes}>{match.notes || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 mr-1" onClick={() => onEditRequest(match)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
