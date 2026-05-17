import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> | { id: string } };

export async function GET(_request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);
    const numeric = Number(id);
    const test = await prisma.studyTest.findFirst({
        where: Number.isFinite(numeric) ? { OR: [{ id: numeric }, { slug: id }] } : { slug: id },
        include: { items: { include: { problem: true }, orderBy: { order: "asc" } }, attempts: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!test) return NextResponse.json({ message: "테스트를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({
        test: {
            id: test.slug,
            dbId: test.id,
            title: test.title,
            description: test.description,
            type: test.type,
            status: test.status,
            durationMin: test.durationMin,
            difficulty: test.difficulty,
            tags: test.tags,
        },
        problems: test.items.map((item) => ({
            order: item.order,
            id: item.problem.number,
            title: item.problem.title,
            difficulty: toDifficulty(item.problem.difficulty),
            score: item.score,
            href: `/problems/${item.problem.number}`,
        })),
        attempts: test.attempts.map((attempt) => ({
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
            href: `/tests/${test.slug}/result?attempt=${attempt.id}`,
        })),
    });
}
