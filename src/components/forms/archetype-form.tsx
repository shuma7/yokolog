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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_GAME_CLASSES, type GameClass, type Archetype } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const archetypeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be at most 50 characters."),
  abbreviation: z.string().min(1, "Abbreviation is required.").max(10, "Abbreviation must be at most 10 characters."),
  gameClass: z.enum(ALL_GAME_CLASSES, { required_error: "Please select a game class." }),
});

type ArchetypeFormValues = z.infer<typeof archetypeFormSchema>;

interface ArchetypeFormProps {
  onSubmit: (data: ArchetypeFormValues) => void;
  initialData?: Partial<Archetype>;
  submitButtonText?: string;
}

export function ArchetypeForm({ onSubmit, initialData, submitButtonText = "Add Archetype" }: ArchetypeFormProps) {
  const form = useForm<ArchetypeFormValues>({
    resolver: zodResolver(archetypeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      abbreviation: initialData?.abbreviation || "",
      gameClass: initialData?.gameClass || undefined,
    },
  });

  function handleSubmit(data: ArchetypeFormValues) {
    onSubmit(data);
    form.reset(); // Reset form after submission
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{submitButtonText === "Add Archetype" ? "Propose New Archetype" : "Edit Archetype"}</CardTitle>
        <CardDescription>
          {submitButtonText === "Add Archetype" 
            ? "Define a new archetype with its name, abbreviation, and class." 
            : "Update the details for this archetype."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archetype Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Control Forest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CtrlF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gameClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_GAME_CLASSES.map((gc) => (
                        <SelectItem key={gc} value={gc}>
                          {gc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
