import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ tag: string }> | { tag: string } };

export async function GET(_request: NextRequest, context: Context) {
    const { tag } = await Promise.resolve(context.params);
    const decoded = decodeURIComponent(tag);
    const problems = await prisma.problem.findMany({ where: { tags: { has: decoded } }, include: { submissions: true }, orderBy: { number: "asc" } });
    return NextResponse.json({
        tag: decoded,
        problems: problems.map((problem) => ({
            id: problem.number,
            title: problem.title,
            difficulty: toDifficulty(problem.difficulty),
            category: problem.category,
            submissions: problem.submissions.length,
            accepted: problem.submissions.filter((s) => s.status === "accepted").length,
            href: `/problems/${problem.number}`,
        })),
    });
}
