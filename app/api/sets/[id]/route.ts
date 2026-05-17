import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> | { id: string } };

export async function GET(_request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);
    const numeric = Number(id);
    const set = await prisma.problemSet.findFirst({
        where: Number.isFinite(numeric) ? { OR: [{ id: numeric }, { slug: id }] } : { slug: id },
        include: { items: { include: { problem: true }, orderBy: { order: "asc" } } },
    });
    if (!set) return NextResponse.json({ message: "세트를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({
        set: {
            id: set.slug,
            dbId: set.id,
            title: set.title,
            description: set.description,
            category: set.category,
            difficulty: set.difficulty,
            status: set.status,
            progress: set.progress,
            tags: set.tags,
            updatedAtText: formatDate(set.updatedAt),
        },
        problems: set.items.map((item) => ({
            order: item.order,
            id: item.problem.number,
            title: item.problem.title,
            difficulty: toDifficulty(item.problem.difficulty),
            category: item.problem.category,
            score: item.problem.score,
            href: `/problems/${item.problem.number}`,
        })),
    });
}
