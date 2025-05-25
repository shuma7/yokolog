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
import { Trash2 } from "lucide-react"; // Edit3 removed as per previous state
import type { MatchData, Archetype, GameClass } from "@/types";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON } from "@/lib/game-data";
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
  matches: MatchData[];
  archetypes: Archetype[];
  onDeleteMatch: (matchId: string) => void;
  gameClassMapping: Record<GameClass, string>;
}

export function UserLogTable({ matches, archetypes, onDeleteMatch, gameClassMapping }: UserLogTableProps) {
  const getArchetypeDetails = (archetypeId: string) : Archetype | undefined => {
    return archetypes.find(a => a.id === archetypeId);
  };

  const getResultText = (result: "win" | "loss" | "draw") => {
    switch (result) {
      case "win": return "勝利";
      case "loss": return "敗北";
      case "draw": return "引分";
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

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>自分のデッキタイプ</TableHead>
            <TableHead>相手のデッキタイプ</TableHead>
            <TableHead>ターン</TableHead>
            <TableHead>結果</TableHead>
            <TableHead>メモ</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const userArchetype = getArchetypeDetails(match.userArchetypeId);
            const opponentArchetype = getArchetypeDetails(match.opponentArchetypeId);
            const UserIcon = userArchetype ? CLASS_ICONS[userArchetype.gameClass] || GENERIC_ARCHETYPE_ICON : GENERIC_ARCHETYPE_ICON;
            const OpponentIcon = opponentArchetype ? CLASS_ICONS[opponentArchetype.gameClass] || GENERIC_ARCHETYPE_ICON : GENERIC_ARCHETYPE_ICON;

            return (
              <TableRow key={match.id}>
                <TableCell>{format(new Date(match.timestamp), 'yyyy年M月d日 HH:mm', { locale: ja })}</TableCell>
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
                  <Badge variant={match.result === 'win' ? 'default' : match.result === 'loss' ? 'destructive' : 'secondary'} 
                         className={`capitalize ${match.result === 'win' ? 'bg-green-600 hover:bg-green-700 text-white' : match.result === 'loss' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                    {getResultText(match.result)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={match.notes}>{match.notes || '-'}</TableCell>
                <TableCell className="text-right">
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
