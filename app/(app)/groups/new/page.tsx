"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Loader2, Plus, Users, ArrowRight } from "lucide-react";

const createSchema = z.object({ name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים") });
const joinSchema = z.object({ inviteCode: z.string().min(1, "נא להזין קוד") });

function NewGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("join") ? "join" : "create";

  const createForm = useForm<{ name: string }>({ resolver: zodResolver(createSchema) });
  const joinForm = useForm<{ inviteCode: string }>({ resolver: zodResolver(joinSchema) });
  const [loading, setLoading] = useState(false);

  async function onCreate(data: { name: string }) {
    setLoading(true);
    const res = await fetch("/api/groups/new", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { toast({ title: "שגיאה", description: json.error, variant: "destructive" }); return; }
    toast({ title: "✅ הקבוצה נוצרה!", description: `קוד הזמנה: ${json.inviteCode}` });
    router.push(`/groups/${json.id}`);
  }

  async function onJoin(data: { inviteCode: string }) {
    setLoading(true);
    const res = await fetch("/api/groups/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { toast({ title: "שגיאה", description: json.error, variant: "destructive" }); return; }
    toast({ title: "✅ הצטרפת!", description: `הצטרפת לקבוצה: ${json.name}` });
    router.push(`/groups/${json.groupId}`);
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
          <ArrowRight className="h-4 w-4" />חזרה לדשבורד
        </Link>
        <h1 className="text-2xl font-bold">קבוצה חדשה</h1>
        <p className="text-muted-foreground">צור קבוצת פוקר חדשה או הצטרף לקיימת</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="create" className="flex-1 gap-2"><Plus className="h-4 w-4" />צור קבוצה</TabsTrigger>
          <TabsTrigger value="join" className="flex-1 gap-2"><Users className="h-4 w-4" />הצטרף</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>צור קבוצה חדשה</CardTitle>
              <CardDescription>תהיה המנהל של הקבוצה ותוכל להזמין שחקנים</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
                <div className="space-y-2">
                  <Label>שם הקבוצה</Label>
                  <Input placeholder="למשל: ג'נטלמנס פוקר" {...createForm.register("name")} />
                  {createForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                  צור קבוצה
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>הצטרף לקבוצה</CardTitle>
              <CardDescription>הזן קוד הזמנה שקיבלת ממנהל הקבוצה</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={joinForm.handleSubmit(onJoin)} className="space-y-4">
                <div className="space-y-2">
                  <Label>קוד הזמנה</Label>
                  <Input placeholder="למשל: POKER2024" className="uppercase" {...joinForm.register("inviteCode")} />
                  {joinForm.formState.errors.inviteCode && (
                    <p className="text-xs text-destructive">{joinForm.formState.errors.inviteCode.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Users className="h-4 w-4 ml-2" />}
                  הצטרף
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewGroupPage() {
  return (
    <Suspense>
      <NewGroupForm />
    </Suspense>
  );
}
