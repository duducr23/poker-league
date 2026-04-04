"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  email: z.string().email("אימייל לא תקין"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast({ title: "שגיאה", description: json.error || "לא ניתן להירשם", variant: "destructive" });
      return;
    }
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="rounded-2xl p-8"
      style={{
        background: "linear-gradient(145deg, #13131f, #0f0f1a)",
        border: "1px solid rgba(212,160,23,0.18)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,160,23,0.08)",
      }}
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">הצטרף לליגה 🃏</h1>
        <p className="text-sm text-slate-500">צור חשבון חדש</p>
        <div className="mt-4 h-px mx-auto w-24" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.5), transparent)" }} />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs uppercase tracking-wider">שם מלא</Label>
          <Input placeholder="ישראל ישראלי" {...register("name")} />
          {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs uppercase tracking-wider">אימייל</Label>
          <Input type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-400 text-xs uppercase tracking-wider">סיסמה</Label>
          <Input type="password" placeholder="לפחות 6 תווים" {...register("password")} />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />נרשם...</> : "הירשם ♦"}
        </Button>
      </form>
      <div className="mt-4 h-px" style={{ background: "rgba(212,160,23,0.1)" }} />
      <p className="mt-4 text-center text-sm text-slate-500">
        יש לך חשבון?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "#d4a017" }}>התחבר</Link>
      </p>
    </div>
  );
}
