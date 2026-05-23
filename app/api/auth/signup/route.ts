import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthSession, setAuthCookie } from "@/lib/auth";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeHandle(email: string) {
    return email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) || `user${Date.now()}`;
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim() || makeHandle(email);
    const handleBase = String(body.handle ?? "").trim() || makeHandle(email);
    if (!email) return NextResponse.json({ message: "이메일을 입력하세요." }, { status: 400 });
    let handle = handleBase;
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { handle } })) {
        suffix += 1;
        handle = `${handleBase}${suffix}`;
    }
    const user = await prisma.user.create({ data: { email, handle, name, role: "user", status: "active", verification: "verified", lastActiveAt: new Date(), ip: request.headers.get("x-forwarded-for") ?? "127.0.0.1" } });
    const session = await createAuthSession(user.id);
    await setAuthCookie(session.id, session.expiresAt);
    return NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle, email: user.email, name: user.name } }, { status: 201 });
}
