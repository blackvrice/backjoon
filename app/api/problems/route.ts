import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryKb, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const tag = request.nextUrl.searchParams.get("tag");
    const where = tag ? { tags: { has: tag } } : {};
    const [problems, acceptedGroups, submissionGroups] = await Promise.all([
        prisma.problem.findMany({ where, include: { testCases: true }, orderBy: [{ recommendedOrder: "asc" }, { number: "asc" }] }),
        prisma.submission.groupBy({ by: ["problemId"], where: { status: "accepted" }, _count: { _all: true } }),
        prisma.submission.groupBy({ by: ["problemId"], _count: { _all: true } }),
    ]);
    const acceptedMap = new Map(acceptedGroups.map((item) => [item.problemId, item._count._all]));
    const submissionMap = new Map(submissionGroups.map((item) => [item.problemId, item._count._all]));

    return NextResponse.json({
        problems: problems.map((problem) => {
            const total = submissionMap.get(problem.id) ?? 0;
            const accepted = acceptedMap.get(problem.id) ?? 0;
            return {
                id: problem.number,
                dbId: problem.id,
                title: problem.title,
                difficulty: toDifficulty(problem.difficulty),
                category: problem.category,
                score: problem.score,
                status: accepted > 0 ? "solved" : "todo",
                solvedRate: acceptedRate(total, accepted) || problem.solvedRate,
                submissions: total,
                accepted,
                timeLimit: formatTimeLimit(problem.timeLimitMs),
                memoryLimit: formatMemoryLimit(problem.memoryLimitMb),
                tags: problem.tags,
                memo: problem.memo || problem.note,
                recommendedOrder: problem.recommendedOrder,
                source: problem.source,
                testCaseCount: problem.testCases.length,
                href: `/problems/${problem.number}`,
                solveHref: `/problems/${problem.number}/solve`,
            };
        }),
    });
}
