import { prisma } from "./db";
import { GroupRole } from "@prisma/client";

function isSuperAdminEmail(email?: string | null) {
  return !!email && !!process.env.SUPER_ADMIN_EMAIL &&
    email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase();
}

async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return isSuperAdminEmail(user?.email);
}

/** Fake GroupMember returned for super admin — has full ADMIN role */
function superAdminMember(groupId: string, userId: string) {
  return {
    id: "super-admin",
    groupId,
    userId,
    role: GroupRole.ADMIN,
    isFrozen: false,
    joinedAt: new Date(),
  } as const;
}

export async function getGroupMember(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function requireGroupMember(groupId: string, userId: string) {
  const member = await getGroupMember(groupId, userId);
  if (member) return member;
  // Super admin can access any group without being a member
  if (await checkIsSuperAdmin(userId)) return superAdminMember(groupId, userId);
  throw new Error("אין לך גישה לקבוצה זו");
}

export async function requireGroupAdmin(groupId: string, userId: string) {
  const member = await requireGroupMember(groupId, userId);
  if (member.role !== GroupRole.ADMIN) throw new Error("רק מנהל יכול לבצע פעולה זו");
  return member;
}

export async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  const member = await getGroupMember(groupId, userId);
  if (member?.role === GroupRole.ADMIN) return true;
  return checkIsSuperAdmin(userId);
}

