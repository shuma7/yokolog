
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Archetype, MatchData, GameClassNameMap, GameClass } from "@/types";
import { ALL_GAME_CLASSES } from '@/types';
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON, formatArchetypeNameWithSuffix } from '@/lib/game-data';
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const matchDataFormSchema = z.object({
  userArchetypeId: z.string().min(1, "自分のデッキタイプを選択してください。"),
  opponentArchetypeId: z.string().min(1, "相手のデッキタイプを選択してください。"),
  turn: z.enum(["first", "second", "unknown"], { required_error: "先攻/後攻を選択してください。" }),
  result: z.enum(["win", "loss"], { required_error: "対戦結果を選択してください。" }),
  notes: z.string().max(500, "メモは500文字以内で入力してください。").optional(),
});

export type MatchFormValues = z.infer<typeof matchDataFormSchema>;

interface MatchDataFormProps {
  archetypes: Archetype[];
  onSubmit: (data: MatchFormValues, resetFormCallback: () => void) => void;
  initialData?: Partial<MatchData>;
  submitButtonText?: string;
  gameClassMapping: GameClassNameMap;
}

type UI_STEP =
  | 'userClass'
  | 'userArchetype'
  | 'opponentClass'
  | 'opponentArchetype'
  | 'turn'
  | 'result'
  | 'notes';

const getArchetypeDisplayInfo = (archetypeId: string | undefined, archetypes: Archetype[]) => {
  if (!archetypeId) return null;
  const archetype = archetypes.find(a => a.id === archetypeId);
  if (!archetype) return { name: "不明なデッキタイプ" };
  return { name: formatArchetypeNameWithSuffix(archetype) };
};

const getTurnDisplay = (turn: "first" | "second" | "unknown" | undefined) => {
  if (!turn) return null;
  if (turn === "unknown") return "不明";
  return turn === "first" ? "先攻" : "後攻";
};

const getResultDisplay = (result: "win" | "loss" | undefined) => {
  if (!result) return null;
  switch (result) {
    case "win": return "勝利";
    case "loss": return "敗北";
    default: return null;
  }
};


export function MatchDataForm({ archetypes, onSubmit, initialData, submitButtonText = "対戦を記録", gameClassMapping }: MatchDataFormProps) {
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchDataFormSchema),
    defaultValues: {
      userArchetypeId: initialData?.userArchetypeId || "",
      opponentArchetypeId: initialData?.opponentArchetypeId || "",
      turn: initialData?.id ? initialData.turn : undefined,
      result: initialData?.id ? initialData.result : undefined,
      notes: initialData?.notes || "",
    },
  });

  const [userSelectedClass, setUserSelectedClass] = useState<GameClass | null>(
    initialData?.userArchetypeId ? archetypes.find(a => a.id === initialData.userArchetypeId)?.gameClass ?? null : null
  );
  const [opponentSelectedClass, setOpponentSelectedClass] = useState<GameClass | null>(
    initialData?.opponentArchetypeId ? archetypes.find(a => a.id === initialData.opponentArchetypeId)?.gameClass ?? null : null
  );

  const [isUserArchetypeSelectOpen, setIsUserArchetypeSelectOpen] = useState(false);
  const [isOpponentArchetypeSelectOpen, setIsOpponentArchetypeSelectOpen] = useState(false);

  const [currentUiStep, setCurrentUiStep] = useState<UI_STEP>(
    initialData?.id ? 'notes' : 'userClass'
  );

  const notesRef = useRef<HTMLTextAreaElement>(null);

  const watchedUserArchetypeId = form.watch("userArchetypeId");
  const watchedOpponentArchetypeId = form.watch("opponentArchetypeId");
  const watchedTurn = form.watch("turn");
  const watchedResult = form.watch("result");

  const sortedArchetypes = useMemo(() => [...archetypes].sort((a, b) => {
    if (a.id === 'unknown') return -1; 
    if (b.id === 'unknown') return 1;
    const classAInfo = ALL_GAME_CLASSES.find(c => c.value === a.gameClass);
    const classBInfo = ALL_GAME_CLASSES.find(c => c.value === b.gameClass);
    const classAOrder = classAInfo ? ALL_GAME_CLASSES.indexOf(classAInfo) : ALL_GAME_CLASSES.length;
    const classBOrder = classBInfo ? ALL_GAME_CLASSES.indexOf(classBInfo) : ALL_GAME_CLASSES.length;

    if (classAOrder !== classBOrder) {
        return classAOrder - classBOrder;
    }
    return a.name.localeCompare(b.name, 'ja');
  }), [archetypes]);

  const filteredUserArchetypes = useMemo(() => {
    if (!userSelectedClass) return [];
    return sortedArchetypes.filter(arch => arch.gameClass === userSelectedClass && arch.id !== 'unknown');
  }, [userSelectedClass, sortedArchetypes]);

  const filteredOpponentArchetypes = useMemo(() => {
    if (!opponentSelectedClass) return [];
    return sortedArchetypes.filter(arch => arch.gameClass === opponentSelectedClass && arch.id !== 'unknown');
  }, [opponentSelectedClass, sortedArchetypes]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        userArchetypeId: initialData.userArchetypeId || "",
        opponentArchetypeId: initialData.opponentArchetypeId || "",
        turn: initialData.turn,
        result: initialData.result,
        notes: initialData.notes || "",
      });
      const initialUserArch = archetypes.find(a => a.id === initialData.userArchetypeId);
      if (initialUserArch) setUserSelectedClass(initialUserArch.gameClass);
      const initialOpponentArch = archetypes.find(a => a.id === initialData.opponentArchetypeId);
      if (initialOpponentArch) setOpponentSelectedClass(initialOpponentArch.gameClass);
      setCurrentUiStep('notes');
    }
  }, [initialData, form, archetypes]);

  const handleUserClassSelect = (gameClass: GameClass) => {
    setUserSelectedClass(gameClass);
    form.setValue('userArchetypeId', '');
    setCurrentUiStep('userArchetype');
    setTimeout(() => setIsUserArchetypeSelectOpen(true), 0);
  };

  const handleOpponentClassSelect = (gameClass: GameClass) => {
    setOpponentSelectedClass(gameClass);
    form.setValue('opponentArchetypeId', '');
    setCurrentUiStep('opponentArchetype');
     setTimeout(() => setIsOpponentArchetypeSelectOpen(true), 0);
  };

  useEffect(() => {
    if (initialData?.id) return;

    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        if (name === 'userArchetypeId' && value.userArchetypeId && currentUiStep === 'userArchetype') {
          setCurrentUiStep('opponentClass');
        } else if (name === 'opponentArchetypeId' && value.opponentArchetypeId && currentUiStep === 'opponentArchetype') {
          setCurrentUiStep('turn');
        } else if (name === 'turn' && (value.turn === 'first' || value.turn === 'second' || value.turn === 'unknown') && currentUiStep === 'turn') {
          setCurrentUiStep('result');
        } else if (name === 'result' && value.result && currentUiStep === 'result') {
          setCurrentUiStep('notes');
          requestAnimationFrame(() => { 
            notesRef.current?.focus();
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentUiStep, initialData?.id]);


  const resetForNextMatch = (keptUserArchetypeId: string) => {
    const keptUserArch = archetypes.find(a => a.id === keptUserArchetypeId);
    if (keptUserArch) {
      setUserSelectedClass(keptUserArch.gameClass);
    }
    form.reset({
      userArchetypeId: keptUserArchetypeId,
      opponentArchetypeId: "",
      turn: undefined,
      result: undefined,
      notes: "",
    });
    setOpponentSelectedClass(null);
    setIsUserArchetypeSelectOpen(false);
    setIsOpponentArchetypeSelectOpen(false);
    setCurrentUiStep('opponentClass');
  };

  const resetToHome = () => {
    setUserSelectedClass(null);
    setOpponentSelectedClass(null);
    form.reset({
      userArchetypeId: "",
      opponentArchetypeId: "",
      turn: undefined,
      result: undefined,
      notes: "",
    });
    setIsUserArchetypeSelectOpen(false);
    setIsOpponentArchetypeSelectOpen(false);
    setCurrentUiStep('userClass');
  };

  function handleFormSubmit(data: MatchFormValues) {
    onSubmit(data, () => {
      if (!initialData?.id) {
        resetForNextMatch(data.userArchetypeId);
      }
    });
  }

  const handleBack = () => {
    if (initialData?.id) return; 

    let newStep: UI_STEP = currentUiStep;

    switch (currentUiStep) {
      case 'notes':
        newStep = 'result';
        break;
      case 'result':
        newStep = 'turn';
        break;
      case 'turn':
        newStep = 'opponentArchetype';
        break;
      case 'opponentArchetype':
        newStep = 'opponentClass';
        break;
      case 'opponentClass':
        newStep = 'userArchetype';
        break;
      case 'userArchetype':
        newStep = 'userClass';
        break;
    }
    if (newStep !== currentUiStep) {
      setCurrentUiStep(newStep);
    }
  };

  const renderArchetypeSelectItem = (archetype: Archetype) => {
    const Icon = archetype.id === 'unknown'
      ? UNKNOWN_ARCHETYPE_ICON
      : CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
    return (
      <SelectItem key={archetype.id} value={archetype.id}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{formatArchetypeNameWithSuffix(archetype)}</span>
        </div>
      </SelectItem>
    );
  };

  const renderClassSelector = (
    selectedClass: GameClass | null,
    onClassSelect: (gameClass: GameClass) => void,
    title: string,
    formMessage?: string
  ) => (
    <FormItem>
      <FormLabel className="text-base font-semibold">{title}</FormLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {ALL_GAME_CLASSES.map(gc => {
          const Icon = CLASS_ICONS[gc.value] || GENERIC_ARCHETYPE_ICON;
          return (
            <Button
              key={gc.value}
              variant={selectedClass === gc.value ? "default" : "outline"}
              onClick={() => onClassSelect(gc.value)}
              type="button"
              className="flex flex-col h-auto p-3 items-center justify-center space-y-1 text-center leading-tight"
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{gc.label}</span>
            </Button>
          );
        })}
      </div>
      {formMessage && <FormMessage>{formMessage}</FormMessage>}
    </FormItem>
  );

  const cardTitle = initialData?.id ? "対戦編集" : "新規対戦を記録";
  const cardDescription = initialData?.id
    ? "この対戦の詳細を更新します。"
    : "最近の対戦の詳細を段階的に記録します。";

  const showUserClass = initialData?.id || currentUiStep === 'userClass';
  const showUserArchetype = initialData?.id || (currentUiStep === 'userArchetype' && userSelectedClass);
  const showOpponentClass = initialData?.id || (currentUiStep === 'opponentClass' && form.getValues("userArchetypeId"));
  const showOpponentArchetype = initialData?.id || (currentUiStep === 'opponentArchetype' && opponentSelectedClass);
  const showTurn = initialData?.id || (currentUiStep === 'turn' && form.getValues("opponentArchetypeId"));
  const showResult = initialData?.id || (currentUiStep === 'result' && (form.getValues("turn") === 'first' || form.getValues("turn") === 'second' || form.getValues("turn") === 'unknown'));
  const showNotesAndSubmit = initialData?.id || (currentUiStep === 'notes' && form.getValues("result"));

  const userArchetypeInfo = getArchetypeDisplayInfo(watchedUserArchetypeId, archetypes);
  const opponentArchetypeInfo = getArchetypeDisplayInfo(watchedOpponentArchetypeId, archetypes);
  const turnInfo = getTurnDisplay(watchedTurn);
  const resultInfo = getResultDisplay(watchedResult);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {(watchedUserArchetypeId || watchedOpponentArchetypeId || watchedTurn || watchedResult) && !initialData?.id && (
            <Card className="mb-6 bg-muted/30">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">現在の選択</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1 pb-4">
                {userArchetypeInfo && (
                  <div><strong>自分のデッキタイプ:</strong> {userArchetypeInfo.name}</div>
                )}
                {opponentArchetypeInfo && (
                  <div><strong>相手のデッキタイプ:</strong> {opponentArchetypeInfo.name}</div>
                )}
                {turnInfo && (
                  <div><strong>手番:</strong> {turnInfo}</div>
                )}
                {resultInfo && (
                  <div><strong>結果:</strong> {resultInfo}</div>
                )}
              </CardContent>
            </Card>
          )}

          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {showUserClass && renderClassSelector(userSelectedClass, handleUserClassSelect, "自分のクラス")}

            {showUserArchetype && (
              <FormField
                control={form.control}
                name="userArchetypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">自分のデッキタイプ</FormLabel>
                    <Select
                      open={isUserArchetypeSelectOpen}
                      onOpenChange={setIsUserArchetypeSelectOpen}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) setIsUserArchetypeSelectOpen(false);
                      }}
                      value={field.value || ""}
                      required
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="自分のデッキタイプを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {filteredUserArchetypes.map(renderArchetypeSelectItem)}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showOpponentClass && (
                <>
                    {renderClassSelector(opponentSelectedClass, handleOpponentClassSelect, "相手のクラス")}
                    {!initialData?.id && currentUiStep === 'opponentClass' && (
                        <Button
                            type="button"
                            variant="link"
                            onClick={resetToHome}
                            className="text-sm text-muted-foreground hover:text-primary px-0"
                        >
                            ホームに戻る (自分のクラスをリセット)
                        </Button>
                    )}
                </>
            )}


            {showOpponentArchetype && (
              <FormField
                control={form.control}
                name="opponentArchetypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">相手のデッキタイプ</FormLabel>
                    <Select
                      open={isOpponentArchetypeSelectOpen}
                      onOpenChange={setIsOpponentArchetypeSelectOpen}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) setIsOpponentArchetypeSelectOpen(false);
                      }}
                      value={field.value || ""}
                      required
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="相手のデッキタイプを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {filteredOpponentArchetypes.map(renderArchetypeSelectItem)}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showTurn && (
              <FormField
                control={form.control}
                name="turn"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">先攻/後攻を選んでください</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={field.value === 'first' ? 'default' : 'outline'}
                          className={cn(
                            "h-auto py-4 text-md sm:py-6 sm:text-lg font-semibold",
                            field.value === 'first' ? "bg-pink-500 hover:bg-pink-600 border-pink-500 hover:border-pink-600 text-white" : "border-muted-foreground/50"
                          )}
                          onClick={() => field.onChange('first')}
                        >
                          先攻
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === 'second' ? 'default' : 'outline'}
                          className={cn(
                            "h-auto py-4 text-md sm:py-6 sm:text-lg font-semibold",
                            field.value === 'second' ? "bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-white" : "border-muted-foreground/50"
                          )}
                          onClick={() => field.onChange('second')}
                        >
                          後攻
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showResult && (
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">対戦結果を選んでください</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <Button
                          type="button"
                          variant={field.value === 'win' ? 'default' : 'outline'}
                          className={cn(
                            "h-auto py-4 text-md sm:py-6 sm:text-lg font-semibold",
                             field.value === 'win' ? "bg-lime-500 hover:bg-lime-600 border-lime-500 hover:border-lime-600 text-white" : "border-muted-foreground/50"
                          )}
                          onClick={() => field.onChange('win')}
                        >
                          勝利
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === 'loss' ? 'default' : 'outline'}
                          className={cn(
                            "h-auto py-4 text-md sm:py-6 sm:text-lg font-semibold",
                            field.value === 'loss' ? "bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white" : "border-muted-foreground/50"
                          )}
                          onClick={() => field.onChange('loss')}
                        >
                          敗北
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showNotesAndSubmit && (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メモ (任意)</FormLabel>
                    <FormControl>
                      <Textarea
                        ref={notesRef}
                        placeholder="対戦に関する特記事項など..."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className={cn(
              "flex flex-col-reverse sm:flex-row gap-3 pt-4",
              (currentUiStep !== 'userClass' && !initialData?.id && showNotesAndSubmit) ? 'sm:justify-between' : 'sm:justify-end'
            )}>
              {(currentUiStep !== 'userClass' && !initialData?.id) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="w-full sm:w-auto"
                >
                  戻る
                </Button>
              )}
              {showNotesAndSubmit && (
                <Button
                  type="submit"
                  className={cn(
                    "font-bold", 
                    initialData?.id
                      ? "w-full sm:w-auto text-lg py-3" 
                      : "w-full text-3xl py-6"   
                  )}
                >
                  {initialData?.id ? (submitButtonText || "対戦情報を更新") : "NEXT!"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

