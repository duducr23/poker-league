import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWebPushToUser } from "@/lib/push";
import { buildPayload } from "@/lib/push-payloads";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  await sendWebPushToUser(session.user.id, buildPayload("TEST", {}));

  return NextResponse.json({ ok: true });
}
