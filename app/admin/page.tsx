import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { TogglePermission } from "@/components/admin/toggle-permission";
import { CopyInviteLinks } from "@/components/admin/copy-invite-link";
import { EditUserForm } from "@/components/admin/edit-user-form";
import { AdminGroupsPanel } from "@/components/admin/admin-groups-panel";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
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

        {/* Users table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(212,160,23,0.12)" }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
          >
            <Users className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-semibold text-slate-300">
              משתמשים רשומים ({realUsers.length})
            </span>
          </div>
          <div className="divide-y" style={{ background: "#0d0d18", borderColor: "rgba(212,160,23,0.07)" }}>
            {realUsers.map((user) => (
              <div key={user.id} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", color: "#0a0a12" }}
                  >
                    {user.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
                      {user.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase() && (
                        <Badge variant="default" className="text-xs">סופר-אדמין</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {user._count.groupMemberships} קבוצות · הצטרף {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {user.email?.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL?.toLowerCase() && (
                      <EditUserForm
                        userId={user.id}
                        initialName={user.name}
                        initialEmail={user.email}
                      />
                    )}
                    {user.email?.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL?.toLowerCase() ? (
                      <TogglePermission userId={user.id} canCreateGroup={user.canCreateGroup} />
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-700/40">
                        גישה מלאה
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {realUsers.length === 0 && (
              <p className="text-center text-slate-500 py-8 text-sm">אין משתמשים רשומים עדיין</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
