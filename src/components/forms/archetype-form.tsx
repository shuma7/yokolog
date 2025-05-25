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
  name: z.string().min(1, "名前は1文字以上で入力してください。").max(50, "名前は50文字以内で入力してください。"),
  abbreviation: z.string().min(1, "略称は必須です。").max(10, "略称は10文字以内で入力してください。"),
  gameClass: z.enum(ALL_GAME_CLASSES.map(gc => gc.value) as [GameClass, ...GameClass[]], { required_error: "クラスを選択してください。" }),
});

type ArchetypeFormValues = z.infer<typeof archetypeFormSchema>;

interface ArchetypeFormProps {
  onSubmit: (data: ArchetypeFormValues) => void;
  initialData?: Partial<Archetype>;
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
  });

  const currentSubmitText = initialData?.id ? "デッキタイプ更新" : submitButtonText;

  function handleSubmit(data: ArchetypeFormValues) {
    onSubmit(data);
    if (!initialData?.id) { // Only reset if it's a new archetype form
        form.reset({ name: "", abbreviation: "", gameClass: undefined });
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{currentSubmitText === "デッキタイプ追加" ? "新規デッキタイプ提案" : "デッキタイプ編集"}</CardTitle>
        <CardDescription>
          {currentSubmitText === "デッキタイプ追加" 
            ? "新しいデッキタイプの名前、略称、クラスを定義します。" 
            : "このデッキタイプの詳細を更新します。"}
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
                  <FormLabel>デッキタイプ名</FormLabel>
                  <FormControl>
                    <Input placeholder="例：コントロールエルフ" {...field} />
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
                  <FormLabel>略称</FormLabel>
                  <FormControl>
                    <Input placeholder="例：コンエ" {...field} />
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
                  <FormLabel>クラス</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" className="w-full">
              {currentSubmitText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
