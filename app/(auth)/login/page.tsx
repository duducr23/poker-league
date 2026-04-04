"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Mail, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().email("אימייל לא תקין"),
  password: z.string().min(1, "נא להזין סיסמה"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const res = await signIn("credentials", { ...data, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast({ title: "שגיאת התחברות", description: "אימייל או סיסמה שגויים", variant: "destructive" });
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">ברוך הבא 🃏</h1>
        <p className="text-sm text-slate-500">התחבר לחשבונך כדי להמשיך</p>
        {/* Gold divider */}
        <div className="mt-4 h-px mx-auto w-24" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.5), transparent)" }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" style={{ color: "#d4a017" }} />
            אימייל
          </Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" style={{ color: "#d4a017" }} />
            סיסמה
          </Label>
          <Input id="password" type="password" placeholder="••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />מתחבר...</> : "כניסה ♠"}
        </Button>
      </form>

      <div className="mt-4 h-px" style={{ background: "rgba(212,160,23,0.1)" }} />

      <p className="mt-4 text-center text-sm text-slate-500">
        אין לך חשבון?{" "}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: "#d4a017" }}>
          הירשם עכשיו
        </Link>
      </p>
    </div>
  );
}
