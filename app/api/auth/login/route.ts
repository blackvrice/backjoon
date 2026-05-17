import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return NextResponse.json({ message: "이메일을 입력하세요." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ message: "등록되지 않은 사용자입니다." }, { status: 404 });
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    return NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle, email: user.email, name: user.name, role: user.role } });
}
