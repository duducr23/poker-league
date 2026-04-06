import webpush from "web-push";
import { prisma } from "@/lib/db";
import { type NotificationPayload } from "./push-payloads";

// Lazy VAPID initialisation — only runs at request time, never at build time.
let vapidInitialised = false;

function ensureVapid(): boolean {
  if (vapidInitialised) return true;

  const subject = process.env.VAPID_SUBJECT;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  // Strip any accidental "=" padding from the public key (VAPID requires unpadded base64url)
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/=+$/, "");

  if (!subject || !privateKey || !publicKey) return false;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialised = true;
    return true;
  } catch {
    return false;
  }
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
  if (!ensureVapid()) return;

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
  if (!ensureVapid() || !userIds.length) return;
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
