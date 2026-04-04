import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: { group: { select: { id: true, name: true } } },
  });

  const isMember = memberships.some((m) => m.group.id === params.groupId);
  if (!isMember) notFound();

  const groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar groups={groups} activeGroupId={params.groupId} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
