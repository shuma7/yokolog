
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as UiCardDescription } from "@/components/ui/card"; // Renamed to avoid conflict

const archetypeFormSchema = z.object({
  name: z.string().min(1, "名前は1文字以上で入力してください。").max(50, "名前は50文字以内で入力してください。"),
  abbreviation: z.string().min(1, "略称は必須です。").max(10, "略称は10文字以内で入力してください。"), // We keep abbreviation for data, but it's not used in display
  gameClass: z.enum(ALL_GAME_CLASSES.map(gc => gc.value) as [GameClass, ...GameClass[]], { required_error: "クラスを選択してください。" }),
});

type ArchetypeFormValues = z.infer<typeof archetypeFormSchema>;

interface ArchetypeFormProps {
  onSubmit: (data: ArchetypeFormValues) => void;
  initialData?: Partial<Archetype>; // Made Partial to handle new/edit scenarios
  submitButtonText?: string;
}

export function ArchetypeForm({ onSubmit, initialData, submitButtonText = "デッキタイプ追加" }: ArchetypeFormProps) {
  const form = useForm<ArchetypeFormValues>({
    resolver: zodResolver(archetypeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      abbreviation: initialData?.abbreviation || "",
      gameClass: initialData?.gameClass || undefined,
    },
    // Reset form values when initialData changes (e.g., when opening dialog for different archetypes)
    resetOptions: {
        keepDirtyValues: false, 
    },
  });

  // Effect to reset form when initialData changes
  // This is crucial when the same form instance is used for add then edit, or edit different items
  React.useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      abbreviation: initialData?.abbreviation || "",
      gameClass: initialData?.gameClass || undefined,
    });
  }, [initialData, form]);


  const currentSubmitText = initialData?.id ? (submitButtonText || "デッキタイプ更新") : (submitButtonText || "デッキタイプ追加");
  const isEditing = !!initialData?.id;
  const isDefaultArchetype = initialData?.isDefault || false;


  function handleSubmit(data: ArchetypeFormValues) {
    onSubmit(data);
    if (!isEditing) { 
        form.reset({ name: "", abbreviation: "", gameClass: undefined });
    }
  }

  // For the dialog context, we remove the outer Card component from here
  // and let the page manage the Card/Dialog styling.
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>デッキタイプ名</FormLabel>
              <FormControl>
                <Input placeholder="例：コントロール" {...field} disabled={isEditing && isDefaultArchetype} />
              </FormControl>
              <FormDescription>
                クラスに基づくアルファベットが自動で付加されるので、デッキタイプ名にクラス名を含めないでください（例：「コントロール」と入力すると「コントロールE」のように表示されます）。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="abbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>略称 (内部データ用)</FormLabel>
              <FormControl>
                <Input placeholder="例：コン" {...field} disabled={isEditing && isDefaultArchetype} />
              </FormControl>
               <FormDescription>
                この略称は表示には使用されませんが、データ識別のために必要です。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gameClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>クラス</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isEditing && isDefaultArchetype}
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
        <Button type="submit" className="w-full" disabled={isEditing && isDefaultArchetype}>
          {currentSubmitText}
        </Button>
        {isEditing && isDefaultArchetype && (
            <p className="text-sm text-destructive text-center pt-2">デフォルトのデッキタイプは編集できません。</p>
        )}
      </form>
    </Form>
  );
}

    