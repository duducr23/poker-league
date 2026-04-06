import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removePushSubscription } from "@/lib/push";
import { z } from "zod";

const schema = z.object({ endpoint: z.string().url() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  await removePushSubscription(session.user.id, body.data.endpoint);
  return NextResponse.json({ ok: true });
}
