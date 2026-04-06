import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InvitationCard } from "@/components/invitations/invitation-card";
import { CreateInvitationDialog } from "@/components/invitations/create-invitation-dialog";
import { CalendarDays } from "lucide-react";

export default async function InvitationsPage({ params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [member, invitations, groupMembers] = await Promise.all([
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
    }),
    prisma.eventInvitation.findMany({
      where: { groupId: params.groupId },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        responses: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.groupMember.findMany({
      where: { groupId: params.groupId },
      include: { user: { select: { id: true, name: true, image: true } } },
    }),
  ]);

  const memberCount = groupMembers.length;
  const allMembers = groupMembers.map(m => m.user);

  if (!member) redirect("/dashboard");

  const upcoming = invitations.filter(i => new Date(i.date) >= new Date());
  const past = invitations.filter(i => new Date(i.date) < new Date());

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #d4a017, #f5d060)", color: "#0a0a12" }}
          >
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">הזמנות לערב</h1>
            <p className="text-sm text-slate-500">סמן אם אתה מגיע</p>
          </div>
        </div>
        <CreateInvitationDialog groupId={params.groupId} />
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">הזמנות קרובות</p>
          {upcoming.map(inv => (
            <InvitationCard
              key={inv.id}
              invitation={inv as any}
              groupId={params.groupId}
              currentUserId={session.user.id}
              isAdmin={member.role === "ADMIN"}
              totalMembers={memberCount}
              allMembers={allMembers}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "rgba(212,160,23,0.04)", border: "1px dashed rgba(212,160,23,0.15)" }}
        >
          <p className="text-4xl mb-3">🃏</p>
          <p className="text-slate-400 font-medium">אין הזמנות קרובות</p>
          <p className="text-slate-600 text-sm mt-1">לחץ "הזמנה לערב" כדי לשלוח לכולם</p>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">הזמנות שעברו</p>
          {past.map(inv => (
            <InvitationCard
              key={inv.id}
              invitation={inv as any}
              groupId={params.groupId}
              currentUserId={session.user.id}
              isAdmin={member.role === "ADMIN"}
              totalMembers={memberCount}
              allMembers={allMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
