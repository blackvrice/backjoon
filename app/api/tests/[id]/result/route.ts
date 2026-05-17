import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> | { id: string } };

export async function GET(request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);
    const attemptId = Number(request.nextUrl.searchParams.get("attempt") ?? "0");
    const test = await prisma.studyTest.findFirst({
        where: Number.isFinite(Number(id)) ? { OR: [{ id: Number(id) }, { slug: id }] } : { slug: id },
        include: { items: { include: { problem: true }, orderBy: { order: "asc" } } },
    });
    if (!test) return NextResponse.json({ message: "테스트를 찾을 수 없습니다." }, { status: 404 });
    const attempt = attemptId > 0
        ? await prisma.testAttempt.findUnique({ where: { id: attemptId }, include: { user: true } })
        : await prisma.testAttempt.findFirst({ where: { testId: test.id }, include: { user: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({
        test: { id: test.slug, title: test.title, totalScore: test.items.reduce((sum, item) => sum + item.score, 0) },
        attempt: attempt ? {
            id: attempt.id,
            user: attempt.user?.handle ?? "guest",
            status: attempt.status,
            score: attempt.score,
            totalScore: attempt.totalScore,
            solved: attempt.solved,
            total: attempt.total,
            durationMin: attempt.durationMin,
            summary: attempt.summary,
            createdAtText: formatDate(attempt.createdAt),
        } : null,
        problems: test.items.map((item) => ({ id: item.problem.number, title: item.problem.title, score: item.score, difficulty: item.problem.difficulty, href: `/problems/${item.problem.number}` })),
    });
}
