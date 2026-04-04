import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { AppShell } from "@/components/layout/app-shell";
import { ArrowRight, UserCircle2 } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, name: true, email: true, canCreateGroup: true },
    }),
    prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: { group: { select: { id: true, name: true } } },
    }),
  ]);

  const groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));
  const isSuperAdmin = user?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const canCreateGroup = user?.canCreateGroup || isSuperAdmin;

  return (
    <AppShell groups={groups} canCreateGroup={canCreateGroup} isSuperAdmin={isSuperAdmin} userImage={user?.image}>
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
              <ArrowRight className="h-4 w-4" />חזרה לדשבורד
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #d4a017, #f5d060)", color: "#0a0a12" }}
              >
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">הפרופיל שלי</h1>
                <p className="text-sm text-slate-500">בחר אווטאר מצחיק שיופיע לצד שמך</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{ background: "rgba(13,13,24,0.8)", border: "1px solid rgba(212,160,23,0.12)" }}
          >
            <AvatarPicker currentImage={user?.image} />
          </div>
        </div>
    </AppShell>
  );
}
