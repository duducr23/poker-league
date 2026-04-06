import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { savePushSubscription } from "@/lib/push";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const userAgent = req.headers.get("user-agent") ?? undefined;

  await savePushSubscription(session.user.id, body.data, userAgent);
  return NextResponse.json({ ok: true });
}
