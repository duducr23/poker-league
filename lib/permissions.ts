import { prisma } from "./db";
import { GroupRole } from "@prisma/client";

export async function getGroupMember(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function requireGroupMember(groupId: string, userId: string) {
  const member = await getGroupMember(groupId, userId);
  if (!member) throw new Error("אין לך גישה לקבוצה זו");
  return member;
}

export async function requireGroupAdmin(groupId: string, userId: string) {
  const member = await requireGroupMember(groupId, userId);
  if (member.role !== GroupRole.ADMIN) throw new Error("רק מנהל יכול לבצע פעולה זו");
  return member;
}

export async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  const member = await getGroupMember(groupId, userId);
  return member?.role === GroupRole.ADMIN;
}

