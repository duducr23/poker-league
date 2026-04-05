import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { Users, Plus, Spade, CalendarDays, Trophy, ArrowLeft, TrendingUp, TrendingDown, Flame, Zap, Mail } from "lucide-react";
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from "@/lib/utils";
import { getGroupInsights } from "@/lib/insights";
import { CopyCodeButton } from "@/components/ui/copy-code-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { canCreateGroup: true, email: true, image: true },
  });
  const isSuperAdmin = currentUser?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const isAnyGroupAdmin = memberships.some((m) => m.role === "ADMIN");
  const canCreateGroup = currentUser?.canCreateGroup || isSuperAdmin || isAnyGroupAdmin;

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          sessions: { orderBy: { date: "desc" }, take: 1 },
          members: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });



  const groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));

  // Pending invitations — upcoming, not yet answered by this user
  const groupIds = memberships.map(m => m.group.id);
  const pendingInvitations = groupIds.length > 0 ? await prisma.eventInvitation.findMany({
    where: {
      groupId: { in: groupIds },
      date: { gte: new Date() },
      responses: { none: { userId: session.user.id } },
    },
    include: { group: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
    take: 5,
  }) : [];

  // Load insights for the first group (most relevant)
  const firstGroupId = memberships[0]?.group.id;
  const insights = firstGroupId ? await getGroupInsights(firstGroupId) : null;

  return (
    <AppShell groups={groups} canCreateGroup={canCreateGroup} isSuperAdmin={isSuperAdmin} userImage={currentUser?.image}>
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
          <div>
            <h1 className="text-3xl font-bold">שלום, {session.user.name?.split(" ")[0]} 👋</h1>
            <p className="text-muted-foreground mt-1">ברוך הבא ל-Poker League שלך</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {canCreateGroup && (
              <Link href="/groups/new">
                <Button className="gap-2"><Plus className="h-4 w-4" />צור קבוצה חדשה</Button>
              </Link>
            )}
            <Link href="/groups/new?join=1">
              <Button variant="outline" className="gap-2"><Users className="h-4 w-4" />הצטרף עם קוד</Button>
            </Link>
          </div>

          {/* Pending invitations */}
          {pendingInvitations.length > 0 && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)" }}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-400">הזמנות שממתינות לתגובה שלך</span>
                <Badge variant="destructive" className="text-xs">{pendingInvitations.length}</Badge>
              </div>
              {pendingInvitations.map(inv => (
                <Link key={inv.id} href={`/groups/${inv.group.id}/invitations`}>
                  <div
                    className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,160,23,0.1)" }}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">{inv.title}</p>
                      <p className="text-xs text-slate-500">
                        {inv.group.name} · {new Date(inv.date).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-yellow-500 border-yellow-700/40 text-xs">לא ענית</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Insights section */}
          {insights && (insights.hottest || insights.coldest || insights.mostImproved || insights.biggestComeback) && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />תובנות מעניינות
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {insights.hottest && (
                  <Card style={{borderColor:"rgba(251,146,60,0.25)",background:"rgba(251,146,60,0.06)"}}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-orange-400 mb-1">
                        <Flame className="h-4 w-4" />
                        <span className="text-xs font-medium">הכי חם</span>
                      </div>
                      <p className="font-bold text-sm truncate text-slate-100">{insights.hottest.name}</p>
                      <p className="text-xs text-slate-500">{insights.hottest.streak} ניצחונות ברצף</p>
                    </CardContent>
                  </Card>
                )}
                {insights.coldest && (
                  <Card style={{borderColor:"rgba(96,165,250,0.25)",background:"rgba(59,130,246,0.06)"}}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-blue-400 mb-1">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-xs font-medium">הכי קר</span>
                      </div>
                      <p className="font-bold text-sm truncate text-slate-100">{insights.coldest.name}</p>
                      <p className="text-xs text-slate-500">{insights.coldest.streak} הפסדים ברצף</p>
                    </CardContent>
                  </Card>
                )}
                {insights.mostImproved && (
                  <Card style={{borderColor:"rgba(52,211,153,0.25)",background:"rgba(16,185,129,0.06)"}}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-emerald-400 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">הכי משתפר</span>
                      </div>
                      <p className="font-bold text-sm truncate text-slate-100">{insights.mostImproved.name}</p>
                      <p className="text-xs text-slate-500">
                        {insights.mostImproved.improvement > 0 ? "+" : ""}
                        {formatCurrency(insights.mostImproved.improvement)} ממוצע
                      </p>
                    </CardContent>
                  </Card>
                )}
                {insights.biggestComeback && (
                  <Card style={{borderColor:"rgba(167,139,250,0.25)",background:"rgba(139,92,246,0.06)"}}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-purple-400 mb-1">
                        <Trophy className="h-4 w-4" />
                        <span className="text-xs font-medium">קאמבאק גדול</span>
                      </div>
                      <p className="font-bold text-sm truncate text-slate-100">{insights.biggestComeback.name}</p>
                      <p className="text-xs text-slate-500">+{formatCurrency(insights.biggestComeback.amount)} שחזור</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {memberships.length === 0 ? (
            <EmptyState icon={Spade} title="אין לך קבוצות עדיין" description="הצטרף לקבוצה עם קוד הזמנה" action={<Link href="/groups/new?join=1"><Button>הצטרף עם קוד</Button></Link>} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {memberships.map(({ group, role }) => {
                const lastSession = group.sessions[0];
                return (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Spade className="h-5 w-5 text-primary" />{group.name}
                        </CardTitle>
                        <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
                          {role === "ADMIN" ? "מנהל" : "חבר"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{group.members.length} חברים</span>
                          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{group.sessions.length} ערבים</span>
                        </div>
                        <CopyCodeButton code={(group as any).inviteCode} />
                      </div>
                      {lastSession && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <p className="text-xs text-muted-foreground mb-1">ערב אחרון</p>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatDate(lastSession.date)}</span>
                            <span className={getStatusColor(lastSession.status)}>
                              {getStatusLabel(lastSession.status)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/groups/${group.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1">כניסה <ArrowLeft className="h-3 w-3" /></Button>
                        </Link>
                        <Link href={`/groups/${group.id}/leaderboard`}>
                          <Button variant="ghost" size="sm"><Trophy className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
    </AppShell>
  );
}
