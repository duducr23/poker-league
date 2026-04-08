import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CopyInviteLinks } from "@/components/admin/copy-invite-link";
import { AdminGroupsPanel } from "@/components/admin/admin-groups-panel";
import { AdminUsersSection } from "@/components/admin/admin-users-section";
import { SeedDemoButton } from "@/components/admin/seed-demo-button";
import { Shield, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email?.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL?.toLowerCase()) {
    redirect("/dashboard");
  }

  const headersList = headers();
  const host = headersList.get("host") || "";
  const proto = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const [groups, users] = await Promise.all([
    prisma.group.findMany({
      select: {
        id: true,
        name: true,
        inviteCode: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        canCreateGroup: true,
        createdAt: true,
        _count: { select: { groupMemberships: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const realUsers = users.filter((u) => !u.email.endsWith("@poker.internal"));

  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{ background: "linear-gradient(180deg, #0a0a12 0%, #080810 100%)" }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ArrowRight className="h-4 w-4" />חזרה לדשבורד
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #d4a017, #f5d060)", color: "#0a0a12" }}
          >
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #d4a017, #f5d060)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              לוח ניהול
            </h1>
            <p className="text-sm text-slate-500">ניהול משתמשים וקבוצות</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.12)" }}
          >
            <p className="text-xs text-slate-500 mb-1">משתמשים</p>
            <p className="text-2xl font-bold text-slate-100">{realUsers.length}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.12)" }}
          >
            <p className="text-xs text-slate-500 mb-1">קבוצות</p>
            <p className="text-2xl font-bold text-slate-100">{groups.length}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.12)" }}
          >
            <p className="text-xs text-slate-500 mb-1">מנהלי קבוצות</p>
            <p className="text-2xl font-bold text-slate-100">
              {realUsers.filter((u) => u.canCreateGroup).length}
            </p>
          </div>
        </div>

        {/* Demo group */}
        <SeedDemoButton />

        {/* Invite links */}
        <CopyInviteLinks groups={groups} baseUrl={baseUrl} />

        {/* Groups panel */}
        <AdminGroupsPanel
          groups={groups.map((g) => ({
            id: g.id,
            name: g.name,
            inviteCode: g.inviteCode,
            memberCount: g._count.members,
          }))}
        />

        {/* Users section */}
        <AdminUsersSection
          users={realUsers.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            canCreateGroup: u.canCreateGroup,
            createdAt: u.createdAt.toISOString(),
            groupCount: u._count.groupMemberships,
          }))}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          superAdminEmail={process.env.SUPER_ADMIN_EMAIL || ""}
        />
      </div>
    </div>
  );
}
