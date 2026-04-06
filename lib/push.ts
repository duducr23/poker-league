import webpush from "web-push";
import { prisma } from "@/lib/db";
import { type NotificationPayload } from "./push-payloads";

// Initialize VAPID only if all env vars are present
const vapidConfigured =
  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  !!process.env.VAPID_PRIVATE_KEY &&
  !!process.env.VAPID_SUBJECT;

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

// ── Subscription management ────────────────────────────────────────────────

export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null,
      isActive: true,
      lastUsedAt: new Date(),
    },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? undefined,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription
    .deleteMany({ where: { userId, endpoint } })
    .catch(() => {});
}

export async function getActivePushSubscriptions(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId, isActive: true },
  });
}

export async function markInvalidSubscription(endpoint: string) {
  await prisma.pushSubscription
    .updateMany({ where: { endpoint }, data: { isActive: false } })
    .catch(() => {});
}

// ── Sending ────────────────────────────────────────────────────────────────

async function sendToSubscription(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    // Update lastUsedAt on success
    await prisma.pushSubscription
      .update({ where: { id: sub.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      // Subscription is gone — remove it
      await prisma.pushSubscription
        .delete({ where: { id: sub.id } })
        .catch(() => {});
    } else if (status === 413) {
      // Payload too large — mark inactive
      await markInvalidSubscription(sub.endpoint);
    }
    // All other errors: ignore silently (network issues, rate limiting, etc.)
  }
}

export async function sendWebPushToUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  if (!vapidConfigured) return;

  // Check user preferences
  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: {
        notifFinancial: true,
        notifFoodPayments: true,
        notifSessionEvents: true,
      },
    })
    .catch(() => null);

  if (!user) return;

  // Preference gating
  const type = payload.type;
  if (
    (type === "FINANCIAL_REQUEST_CREATED" ||
      type === "FINANCIAL_REQUEST_APPROVED" ||
      type === "FINANCIAL_REQUEST_DECLINED") &&
    user.notifFinancial === false
  )
    return;
  if (
    (type === "EXPENSE_CHARGE_CREATED" ||
      type === "EXPENSE_PROOF_UPLOADED" ||
      type === "EXPENSE_PROOF_APPROVED" ||
      type === "EXPENSE_PROOF_DECLINED") &&
    user.notifFoodPayments === false
  )
    return;
  if (
    (type === "SESSION_CLOSED" || type === "INVITATION_CREATED") &&
    user.notifSessionEvents === false
  )
    return;

  const subscriptions = await getActivePushSubscriptions(userId);
  if (!subscriptions.length) return;

  await Promise.allSettled(
    subscriptions.map((sub) => sendToSubscription(sub, payload))
  );
}

export async function sendWebPushToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<void> {
  if (!vapidConfigured || !userIds.length) return;
  await Promise.allSettled(userIds.map((uid) => sendWebPushToUser(uid, payload)));
}

// ── Legacy alias (kept for any remaining callers) ─────────────────────────
// Deprecated: use sendWebPushToUsers instead
export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<void> {
  if (!userIds.length) return;
  await sendWebPushToUsers(userIds, {
    type: "TEST",
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/dashboard",
    tag: payload.tag,
  });
}
