"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Archetype, MatchData, GameClass, GameClassNameMap } from "@/types";
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON } from '@/lib/game-data';
import { ScrollArea } from "@/components/ui/scroll-area";

const matchDataFormSchema = z.object({
  userArchetypeId: z.string().min(1, "自分のデッキタイプを選択してください。"),
  opponentArchetypeId: z.string().min(1, "相手のデッキタイプを選択してください。"),
  turn: z.enum(["first", "second", "unknown"], { required_error: "先攻/後攻を選択してください。" }),
  result: z.enum(["win", "loss", "draw"], { required_error: "対戦結果を選択してください。" }),
  notes: z.string().max(500, "メモは500文字以内で入力してください。").optional(),
});

export type MatchFormValues = z.infer<typeof matchDataFormSchema>;

interface MatchDataFormProps {
  archetypes: Archetype[];
  onSubmit: (data: MatchFormValues) => void;
  initialData?: Partial<MatchData>;
  submitButtonText?: string;
  gameClassMapping: GameClassNameMap;
}

export function MatchDataForm({ archetypes, onSubmit, initialData, submitButtonText = "対戦を記録", gameClassMapping }: MatchDataFormProps) {
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchDataFormSchema),
    defaultValues: {
      userArchetypeId: initialData?.userArchetypeId || "",
      opponentArchetypeId: initialData?.opponentArchetypeId || "",
      turn: initialData?.turn || "unknown",
      result: initialData?.result || undefined,
      notes: initialData?.notes || "",
    },
  });

  const sortedArchetypes = [...archetypes].sort((a, b) => {
    const classA = gameClassMapping[a.gameClass] || a.gameClass;
    const classB = gameClassMapping[b.gameClass] || b.gameClass;
    if (classA === classB) {
      return a.name.localeCompare(b.name, 'ja');
    }
    return classA.localeCompare(classB, 'ja');
  });
  
  const currentSubmitText = initialData?.id ? "対戦を更新" : submitButtonText;

  const renderArchetypeSelectItem = (archetype: Archetype) => {
    const Icon = CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
    const displayClass = gameClassMapping[archetype.gameClass] || archetype.gameClass;
    return (
      <SelectItem key={archetype.id} value={archetype.id}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{archetype.name} ({archetype.abbreviation}) - {displayClass}</span>
        </div>
      </SelectItem>
    );
  };


  function handleSubmit(data: MatchFormValues) {
    onSubmit(data);
     if (!initialData?.id) { // Only reset if it's a new match form
        form.reset({ 
            userArchetypeId: "",
            opponentArchetypeId: "",
            turn: "unknown",
            result: undefined,
            notes: "",
        });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{currentSubmitText === "対戦を記録" ? "新規対戦を記録" : "対戦編集"}</CardTitle>
        <CardDescription>
          {currentSubmitText === "対戦を記録" 
            ? "最近の対戦の詳細を記録します。"
            : "この対戦の詳細を更新します。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="userArchetypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>自分のデッキタイプ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="自分のデッキタイプを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                         {sortedArchetypes.map(renderArchetypeSelectItem)}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="opponentArchetypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>相手のデッキタイプ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="相手のデッキタイプを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {sortedArchetypes.map(renderArchetypeSelectItem)}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="turn"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>先攻/後攻</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="first" />
                          </FormControl>
                          <FormLabel className="font-normal">先攻</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="second" />
                          </FormControl>
                          <FormLabel className="font-normal">後攻</FormLabel>
                        </FormItem>
                         <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="unknown" />
                          </FormControl>
                          <FormLabel className="font-normal">不明</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>対戦結果</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="win" />
                          </FormControl>
                          <FormLabel className="font-normal">勝利</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="loss" />
                          </FormControl>
                          <FormLabel className="font-normal">敗北</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="draw" />
                          </FormControl>
                          <FormLabel className="font-normal">引分</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ (任意)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="対戦に関する特記事項など..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {currentSubmitText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
