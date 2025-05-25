
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import type { Archetype, MatchData, GameClassNameMap, GameClass } from "@/types";
import { ALL_GAME_CLASSES } from '@/types'; // Corrected import
import { CLASS_ICONS, GENERIC_ARCHETYPE_ICON, UNKNOWN_ARCHETYPE_ICON } from '@/lib/game-data'; // ALL_GAME_CLASSES removed from here
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useMemo, useRef, useState } from "react";

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

  const [userSelectedClass, setUserSelectedClass] = useState<GameClass | null>(
    initialData?.userArchetypeId ? archetypes.find(a => a.id === initialData.userArchetypeId)?.gameClass ?? null : null
  );
  const [opponentSelectedClass, setOpponentSelectedClass] = useState<GameClass | null>(
    initialData?.opponentArchetypeId ? archetypes.find(a => a.id === initialData.opponentArchetypeId)?.gameClass ?? null : null
  );
  
  const [currentUiStep, setCurrentUiStep] = useState<UI_STEP>(
    initialData?.id ? 'notes' : 'userClass' 
  );

  const notesRef = useRef<HTMLTextAreaElement>(null);

  const sortedArchetypes = useMemo(() => [...archetypes].sort((a, b) => {
    if (a.id === 'unknown') return -1;
    if (b.id === 'unknown') return 1;
    const classA = gameClassMapping[a.gameClass] || a.gameClass;
    const classB = gameClassMapping[b.gameClass] || b.gameClass;
    if (classA === classB) {
      return a.name.localeCompare(b.name, 'ja');
    }
    return classA.localeCompare(classB, 'ja');
  }), [archetypes, gameClassMapping]);

  const filteredUserArchetypes = useMemo(() => {
    if (!userSelectedClass) return [];
    return sortedArchetypes.filter(arch => arch.gameClass === userSelectedClass || arch.id === 'unknown');
  }, [userSelectedClass, sortedArchetypes]);

  const filteredOpponentArchetypes = useMemo(() => {
    if (!opponentSelectedClass) return [];
    return sortedArchetypes.filter(arch => arch.gameClass === opponentSelectedClass || arch.id === 'unknown');
  }, [opponentSelectedClass, sortedArchetypes]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        userArchetypeId: initialData.userArchetypeId || "",
        opponentArchetypeId: initialData.opponentArchetypeId || "",
        turn: initialData.turn || "unknown",
        result: initialData.result || undefined,
        notes: initialData.notes || "",
      });
      const initialUserArch = archetypes.find(a => a.id === initialData.userArchetypeId);
      if (initialUserArch) setUserSelectedClass(initialUserArch.gameClass);
      const initialOpponentArch = archetypes.find(a => a.id === initialData.opponentArchetypeId);
      if (initialOpponentArch) setOpponentSelectedClass(initialOpponentArch.gameClass);
      setCurrentUiStep('notes'); // For editing, show all fields or jump to notes
    }
  }, [initialData, form, archetypes]);

  const handleUserClassSelect = (gameClass: GameClass) => {
    setUserSelectedClass(gameClass);
    form.setValue('userArchetypeId', ''); 
    setCurrentUiStep('userArchetype');
  };

  const handleOpponentClassSelect = (gameClass: GameClass) => {
    setOpponentSelectedClass(gameClass);
    form.setValue('opponentArchetypeId', '');
    setCurrentUiStep('opponentArchetype');
  };
  
  useEffect(() => {
    if (initialData?.id) return; // Don't auto-advance steps when editing

    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        if (name === 'userArchetypeId' && value.userArchetypeId && currentUiStep === 'userArchetype') {
          setCurrentUiStep('opponentClass');
        } else if (name === 'opponentArchetypeId' && value.opponentArchetypeId && currentUiStep === 'opponentArchetype') {
          setCurrentUiStep('turn');
        } else if (name === 'turn' && value.turn && value.turn !== 'unknown' && currentUiStep === 'turn') {
          setCurrentUiStep('result');
        } else if (name === 'result' && value.result && currentUiStep === 'result') {
          setCurrentUiStep('notes');
          notesRef.current?.focus();
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
      turn: "unknown",
      result: undefined,
      notes: "",
    });
    setOpponentSelectedClass(null);
    setCurrentUiStep('opponentClass');
  };

  function handleFormSubmit(data: MatchFormValues) {
    onSubmit(data, () => {
      if (!initialData?.id) { 
        resetForNextMatch(data.userArchetypeId);
      }
    });
  }

  const renderArchetypeSelectItem = (archetype: Archetype) => {
    const Icon = archetype.id === 'unknown' 
        ? UNKNOWN_ARCHETYPE_ICON 
        : CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
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

  const renderClassSelector = (
    selectedClass: GameClass | null,
    onClassSelect: (gameClass: GameClass) => void,
    title: string,
    formMessage?: string
  ) => (
    <FormItem>
      <FormLabel>{title}</FormLabel>
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
  const showResult = initialData?.id || (currentUiStep === 'result' && form.getValues("turn") !== "unknown");
  const showNotesAndSubmit = initialData?.id || (currentUiStep === 'notes' && form.getValues("result"));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {showUserClass && renderClassSelector(userSelectedClass, handleUserClassSelect, "自分のクラス")}
            
            {showUserArchetype && (
              <FormField
                control={form.control}
                name="userArchetypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>自分のデッキタイプ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} required>
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

            {showOpponentClass && renderClassSelector(opponentSelectedClass, handleOpponentClassSelect, "相手のクラス")}

            {showOpponentArchetype && (
              <FormField
                control={form.control}
                name="opponentArchetypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>相手のデッキタイプ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} required>
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
                    <FormLabel>先攻/後攻</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="first" /></FormControl>
                          <FormLabel className="font-normal">先攻</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="second" /></FormControl>
                          <FormLabel className="font-normal">後攻</FormLabel>
                        </FormItem>
                         <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="unknown" /></FormControl>
                          <FormLabel className="font-normal">不明</FormLabel>
                        </FormItem>
                      </RadioGroup>
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
                    <FormLabel>対戦結果</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="win" /></FormControl>
                          <FormLabel className="font-normal">勝利</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="loss" /></FormControl>
                          <FormLabel className="font-normal">敗北</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="draw" /></FormControl>
                          <FormLabel className="font-normal">引分</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showNotesAndSubmit && (
              <>
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
                <Button type="submit" className="w-full">
                  {initialData?.id ? (submitButtonText || "対戦情報を更新") : "NEXT!"}
                </Button>
              </>
            )}
            
            {/* This explicit button for editing is only needed if the step logic somehow prevents the NEXT! button from showing in edit mode */}
            {/* {initialData?.id && currentUiStep !== 'notes' && (
                 <Button type="submit" className="w-full">
                    {submitButtonText || "対戦情報を更新"}
                 </Button>
            )} */}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

