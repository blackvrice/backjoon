import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const user = await prisma.user.findFirst({ where: { handle: "demo" }, include: { submissions: { include: { problem: true }, orderBy: { createdAt: "desc" }, take: 10 }, notes: true, goals: true, favorites: true } });
    if (!user) return NextResponse.json({ message: "사용자를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({
        profile: {
            handle: user.handle,
            name: user.name ?? user.handle,
            email: user.email,
            role: user.role,
            score: user.score,
            rank: user.rank,
            solved: user.solvedCount,
            tags: user.tags,
            joinedAtText: formatDate(user.createdAt),
            lastActiveAtText: formatDate(user.lastActiveAt ?? user.updatedAt),
        },
        submissions: user.submissions.map((submission) => ({ id: submission.id, problemId: submission.problem.number, problemTitle: submission.problem.title, status: submission.status, language: submission.language, submittedAtText: formatDate(submission.createdAt), href: `/submissions/${submission.id}` })),
        notes: user.notes.length,
        goals: user.goals.length,
        favorites: user.favorites.length,
    });
}
