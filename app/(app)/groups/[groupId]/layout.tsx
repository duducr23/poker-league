import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [memberships, currentUser] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: { group: { select: { id: true, name: true } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canCreateGroup: true, email: true, image: true },
    }),
  ]);

  const isMember = memberships.some((m) => m.group.id === params.groupId);
  if (!isMember) notFound();

  const groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));
  const isSuperAdmin = currentUser?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const isAnyGroupAdmin = memberships.some((m) => m.role === "ADMIN");
  const canCreateGroup = currentUser?.canCreateGroup || isSuperAdmin || isAnyGroupAdmin;

  return (
    <AppShell groups={groups} activeGroupId={params.groupId} canCreateGroup={canCreateGroup} isSuperAdmin={isSuperAdmin} userImage={currentUser?.image}>
      {children}
    </AppShell>
  );
}
