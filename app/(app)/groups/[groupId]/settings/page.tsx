import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isGroupAdmin } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { Users, Key, Settings, Trash2 } from "lucide-react";
import { SeasonManager } from "@/components/settings/season-manager";
import { MembersManager } from "@/components/settings/members-manager";
import { DeleteGroupButton } from "@/components/settings/delete-group-button";

export default async function GroupSettingsPage({ params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!group) notFound();

  const admin = await isGroupAdmin(params.groupId, session.user.id);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">הגדרות קבוצה</h1>
          <p className="text-muted-foreground">{group.name}</p>
        </div>
      </div>

      {/* Invite code */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4" />קוד הזמנה</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="text-2xl font-bold tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-lg">
              {group.inviteCode}
            </code>
            <p className="text-sm text-muted-foreground">שתף קוד זה עם שחקנים שרוצים להצטרף לקבוצה</p>
          </div>
        </CardContent>
      </Card>

      {/* Season management */}
      <SeasonManager groupId={params.groupId} isAdmin={admin} />

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />חברי הקבוצה ({group.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MembersManager
            groupId={params.groupId}
            members={group.members.map((m) => ({
              id: m.id,
              userId: m.userId,
              name: m.user.name ?? "",
              email: m.user.email ?? "",
              role: m.role,
              isFrozen: m.isFrozen,
              joinedAt: m.joinedAt.toISOString(),
            }))}
            currentUserId={session.user.id}
            isAdmin={admin}
          />
        </CardContent>
      </Card>

      {/* Group info */}
      <Card>
        <CardHeader><CardTitle className="text-base">פרטי קבוצה</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">שם</span>
            <span className="font-medium">{group.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">נוצרה</span>
            <span>{formatDate(group.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">תפקיד שלי</span>
            <Badge variant={admin ? "default" : "secondary"}>{admin ? "מנהל" : "חבר"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      {admin && (
        <Card style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <Trash2 className="h-4 w-4" />אזור מסוכן
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-slate-400">מחיקת הקבוצה תמחק את כל הנתונים — ערבים, תוצאות ושחקנים. פעולה זו אינה הפיכה.</p>
            <DeleteGroupButton groupId={params.groupId} groupName={group.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
