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

  const isSuperAdmin = currentUser?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const isAnyGroupAdmin = memberships.some((m) => m.role === "ADMIN");
  const canCreateGroup = currentUser?.canCreateGroup || isSuperAdmin || isAnyGroupAdmin;

  const isMember = memberships.some((m) => m.group.id === params.groupId);
  // Super admin can browse any group even without being a member
  if (!isMember && !isSuperAdmin) notFound();

  let groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));
  if (isSuperAdmin && !isMember) {
    const browsedGroup = await prisma.group.findUnique({
      where: { id: params.groupId },
      select: { id: true, name: true },
    });
    if (!browsedGroup) notFound();
    groups = [...groups, browsedGroup];
  }

  return (
    <AppShell groups={groups} activeGroupId={params.groupId} canCreateGroup={canCreateGroup} isSuperAdmin={isSuperAdmin} userImage={currentUser?.image}>
      {children}
    </AppShell>
  );
}
