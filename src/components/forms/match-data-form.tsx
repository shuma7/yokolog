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
import type { Archetype, MatchData } from "@/types";
import { getArchetypeWithIcon, CLASS_ICONS, GENERIC_ARCHETYPE_ICON } from '@/lib/game-data';
import { ScrollArea } from "@/components/ui/scroll-area";

const matchDataFormSchema = z.object({
  userArchetypeId: z.string().min(1, "Please select your archetype."),
  opponentArchetypeId: z.string().min(1, "Please select opponent's archetype."),
  turn: z.enum(["first", "second", "unknown"], { required_error: "Please select turn order." }),
  result: z.enum(["win", "loss", "draw"], { required_error: "Please select match result." }),
  notes: z.string().max(500, "Notes must be at most 500 characters.").optional(),
});

export type MatchFormValues = z.infer<typeof matchDataFormSchema>;

interface MatchDataFormProps {
  archetypes: Archetype[];
  onSubmit: (data: MatchFormValues) => void;
  initialData?: Partial<MatchData>;
  submitButtonText?: string;
}

export function MatchDataForm({ archetypes, onSubmit, initialData, submitButtonText = "Log Match" }: MatchDataFormProps) {
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
    if (a.gameClass === b.gameClass) {
      return a.name.localeCompare(b.name);
    }
    return a.gameClass.localeCompare(b.gameClass);
  });

  const renderArchetypeSelectItem = (archetype: Archetype) => {
    const Icon = CLASS_ICONS[archetype.gameClass] || GENERIC_ARCHETYPE_ICON;
    return (
      <SelectItem key={archetype.id} value={archetype.id}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{archetype.name} ({archetype.abbreviation}) - {archetype.gameClass}</span>
        </div>
      </SelectItem>
    );
  };


  function handleSubmit(data: MatchFormValues) {
    onSubmit(data);
    form.reset({ // Reset form to initial or empty state after submission
        userArchetypeId: "",
        opponentArchetypeId: "",
        turn: "unknown",
        result: undefined,
        notes: "",
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{submitButtonText === "Log Match" ? "Log New Match" : "Edit Match"}</CardTitle>
        <CardDescription>
          {submitButtonText === "Log Match" 
            ? "Record the details of your recent match."
            : "Update the details for this match."}
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
                    <FormLabel>Your Archetype</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your archetype" />
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
                    <FormLabel>Opponent's Archetype</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select opponent's archetype" />
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
                    <FormLabel>Turn Order</FormLabel>
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
                          <FormLabel className="font-normal">First</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="second" />
                          </FormControl>
                          <FormLabel className="font-normal">Second</FormLabel>
                        </FormItem>
                         <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="unknown" />
                          </FormControl>
                          <FormLabel className="font-normal">Unknown</FormLabel>
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
                    <FormLabel>Match Result</FormLabel>
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
                          <FormLabel className="font-normal">Win</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="loss" />
                          </FormControl>
                          <FormLabel className="font-normal">Loss</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="draw" />
                          </FormControl>
                          <FormLabel className="font-normal">Draw</FormLabel>
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific details about the match..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
