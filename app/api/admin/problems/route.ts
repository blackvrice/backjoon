import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatDate(value?: Date | null) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(value).replace(/\. /g, ".").replace(".", ".");
}

function toDifficulty(value?: string | null) {
    if (value === "Hard" || value === "Medium" || value === "Easy") return value;
    return "Easy";
}

function getTestCaseStatus(testCases: Array<{ isVerified: boolean }>) {
    if (testCases.length === 0) return "missing";
    if (testCases.some((testCase) => !testCase.isVerified)) return "failed";
    return "verified";
}

export async function GET() {
    const [problems, acceptedGroups, submissionGroups] = await Promise.all([
        prisma.problem.findMany({
            include: {
                testCases: {
                    select: {
                        id: true,
                        isSample: true,
                        isHidden: true,
                        isVerified: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        }),
        prisma.submission.groupBy({
            by: ["problemId"],
            where: {
                status: "accepted",
            },
            _count: {
                _all: true,
            },
        }),
        prisma.submission.groupBy({
            by: ["problemId"],
            _count: {
                _all: true,
            },
        }),
    ]);

    const acceptedMap = new Map(acceptedGroups.map((item) => [item.problemId, item._count._all]));
    const submissionMap = new Map(submissionGroups.map((item) => [item.problemId, item._count._all]));

    return NextResponse.json({
        problems: problems.map((problem) => {
            const testCaseCount = problem.testCases.length;
            const sampleCount = problem.testCases.filter((testCase) => testCase.isSample).length;
            const hiddenCaseCount = problem.testCases.filter((testCase) => testCase.isHidden).length;

            return {
                id: problem.number,
                dbId: problem.id,
                title: problem.title,
                slug: problem.slug,
                difficulty: toDifficulty(problem.difficulty),
                score: problem.score,
                source: problem.source,
                status: problem.status,
                testCaseStatus: getTestCaseStatus(problem.testCases),
                timeLimit: `${Math.max(1, Math.round(problem.timeLimitMs / 1000))}초`,
                memoryLimit: `${problem.memoryLimitMb}MB`,
                tags: problem.tags,
                category: problem.category,
                submissions: submissionMap.get(problem.id) ?? 0,
                accepted: acceptedMap.get(problem.id) ?? 0,
                note: problem.note,
                author: problem.authorEmail,
                reviewer: problem.reviewerEmail ?? undefined,
                testCaseCount,
                sampleCount,
                hiddenCaseCount,
                createdAt: problem.createdAt.toISOString(),
                createdAtText: formatDate(problem.createdAt),
                updatedAt: problem.updatedAt.toISOString(),
                updatedAtText: formatDate(problem.updatedAt),
                publishedAt: problem.publishedAt?.toISOString(),
                publishedAtText: formatDate(problem.publishedAt),
                reviewMessage: problem.reviewMessage ?? undefined,
            };
        }),
    });
}
