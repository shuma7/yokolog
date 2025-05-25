
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import React, { useEffect, useState } from "react"; 

const archetypeFormSchema = z.object({
  name: z.string().min(1, "名前は1文字以上で入力してください。").max(50, "名前は50文字以内で入力してください。"),
  gameClass: z.enum(ALL_GAME_CLASSES.map(gc => gc.value) as [GameClass, ...GameClass[]], { required_error: "クラスを選択してください。" }),
});

type ArchetypeFormValues = z.infer<typeof archetypeFormSchema>;

interface ArchetypeFormProps {
  onSubmit: (data: ArchetypeFormValues) => void;
  initialData?: Partial<Archetype>;
  submitButtonText?: string;
  isEditingUnknown?: boolean;
}

export function ArchetypeForm({ onSubmit, initialData, submitButtonText = "デッキタイプ追加", isEditingUnknown = false }: ArchetypeFormProps) {
  const form = useForm<ArchetypeFormValues>({
    resolver: zodResolver(archetypeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      gameClass: initialData?.gameClass || undefined,
    },
    resetOptions: {
        keepDirtyValues: false, 
    },
  });

  const isEditing = !!initialData?.id;
  const watchedGameClass = form.watch("gameClass");

  useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      gameClass: initialData?.gameClass || undefined,
    });
  }, [initialData, form]);

  const currentSubmitText = isEditing ? (submitButtonText || "デッキタイプ更新") : (submitButtonText || "デッキタイプ追加");

  function handleSubmit(data: ArchetypeFormValues) {
    onSubmit(data);
    if (!isEditing) { 
        form.reset({ name: "", gameClass: undefined });
    }
  }
  
  const showNameInput = isEditing || !!watchedGameClass;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="gameClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>クラス</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  if (!isEditing) { // Only clear name if adding new and class changes
                    form.setValue("name", "");
                  }
                }} 
                defaultValue={field.value}
                disabled={isEditingUnknown && field.name === 'gameClass'} // Allow editing class for 'unknown' unless specifically restricted
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="クラスを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ALL_GAME_CLASSES.map((gc) => (
                    <SelectItem key={gc.value} value={gc.value}>
                      {gc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showNameInput && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>デッキタイプ名</FormLabel>
                <FormControl>
                  <Input placeholder="例：コントロール" {...field} />
                </FormControl>
                <FormDescription>
                  クラスに基づくアルファベットが自動で付加されるので、デッキタイプ名にクラス名を含めないでください（例：「コントロール」と入力すると「コントロールE」のように表示されます）。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {showNameInput && (
            <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                {currentSubmitText}
            </Button>
        )}
      </form>
    </Form>
  );
}
