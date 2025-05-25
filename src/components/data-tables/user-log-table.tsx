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
import type { MatchData, Archetype } from "@/types";
import { format } from 'date-fns';
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
  // onEditMatch: (match: MatchData) => void; // TODO: Implement edit functionality
}

export function UserLogTable({ matches, archetypes, onDeleteMatch }: UserLogTableProps) {
  const getArchetypeDetails = (archetypeId: string) : Archetype | undefined => {
    return archetypes.find(a => a.id === archetypeId);
  };

  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No matches logged yet. Go add some!</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Your Archetype</TableHead>
            <TableHead>Opponent's Archetype</TableHead>
            <TableHead>Turn</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                <TableCell>{format(new Date(match.timestamp), 'MMM d, yyyy HH:mm')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {userArchetype ? `${userArchetype.name} (${userArchetype.abbreviation})` : 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OpponentIcon className="h-4 w-4 text-muted-foreground" />
                    {opponentArchetype ? `${opponentArchetype.name} (${opponentArchetype.abbreviation})` : 'Unknown'}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{match.turn}</TableCell>
                <TableCell>
                  <Badge variant={match.result === 'win' ? 'default' : match.result === 'loss' ? 'destructive' : 'secondary'} 
                         className={`capitalize ${match.result === 'win' ? 'bg-green-600 hover:bg-green-700 text-white' : match.result === 'loss' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                    {match.result}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={match.notes}>{match.notes || '-'}</TableCell>
                <TableCell className="text-right">
                  {/* <Button variant="ghost" size="icon" onClick={() => onEditMatch(match)} className="mr-2">
                    <Edit3 className="h-4 w-4" />
                  </Button> */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this match record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteMatch(match.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
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
