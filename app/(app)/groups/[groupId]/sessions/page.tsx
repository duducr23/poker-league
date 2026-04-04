import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { isGroupAdmin } from "@/lib/permissions";
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import { Plus, CalendarDays, MapPin, Users } from "lucide-react";

export default async function SessionsPage({ params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const group = await prisma.group.findUnique({ where: { id: params.groupId }, select: { name: true } });
  if (!group) notFound();

  const admin = await isGroupAdmin(params.groupId, session.user.id);

  const sessions = await prisma.session.findMany({
    where: { groupId: params.groupId },
    orderBy: { date: "desc" },
    include: { results: { include: { user: { select: { name: true } } } } },
  });

  const open = sessions.filter((s) => s.status === "OPEN");
  const closed = sessions.filter((s) => s.status === "CLOSED");
  const cancelled = sessions.filter((s) => s.status === "CANCELLED");

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">ערבי משחק</h1>
          <p className="text-muted-foreground">{group.name}</p>
        </div>
        {admin && (
          <Link href={`/groups/${params.groupId}/sessions/new`}>
            <Button className="gap-2"><Plus className="h-4 w-4" />ערב חדש</Button>
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={CalendarDays} title="אין ערבים עדיין" description="צור את הערב הראשון של הקבוצה" action={admin && <Link href={`/groups/${params.groupId}/sessions/new`}><Button>צור ערב</Button></Link>} />
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <Section title="ערבים פתוחים" sessions={open} groupId={params.groupId} userId={session.user.id} />
          )}
          {closed.length > 0 && (
            <Section title="ערבים סגורים" sessions={closed} groupId={params.groupId} userId={session.user.id} />
          )}
          {cancelled.length > 0 && (
            <Section title="ערבים מבוטלים" sessions={cancelled} groupId={params.groupId} userId={session.user.id} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, sessions, groupId, userId }: {
  title: string;
  sessions: any[];
  groupId: string;
  userId: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-2">
        {sessions.map((s) => {
          const submitted = s.results.filter((r: any) => r.isSubmitted).length;
          const myResult = s.results.find((r: any) => r.userId === userId);
          const myPL = myResult?.isSubmitted ? myResult.profitLoss : null;

          return (
            <Link key={s.id} href={`/groups/${groupId}/sessions/${s.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{formatDate(s.date)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(s.status)}`}>
                          {getStatusLabel(s.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {s.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{submitted}/{s.results.length} הגישו</span>
                      </div>
                    </div>
                    {myPL !== null && (
                      <span className={`font-bold text-lg ${myPL > 0 ? "text-green-600" : myPL < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {myPL > 0 ? "+" : ""}₪{myPL.toLocaleString()}
                      </span>
                    )}
                    {myResult && !myResult.isSubmitted && s.status === "OPEN" && (
                      <span className="text-xs text-amber-600 font-medium">⏳ ממתין להגשה שלך</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
