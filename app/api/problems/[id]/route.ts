import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
    params:
        | {
        id: string;
    }
        | Promise<{
        id: string;
    }>;
};

function formatTimeLimit(ms: number) {
    if (ms % 1000 === 0) {
        return `${ms / 1000}초`;
    }

    return `${ms}ms`;
}

function formatMemoryLimit(mb: number) {
    return `${mb}MB`;
}

function normalizeDifficulty(value: string) {
    if (value === "Easy" || value === "Medium" || value === "Hard") {
        return value;
    }

    return "Easy";
}

function normalizeProblemStatus(value: string) {
    if (value === "solved" || value === "wrong" || value === "todo" || value === "review") {
        return value;
    }

    return "todo";
}

export async function GET(_request: Request, context: RouteContext) {
    const params = await Promise.resolve(context.params);
    const number = Number(params.id);

    if (!Number.isFinite(number)) {
        return NextResponse.json(
            {
                ok: false,
                message: "문제 번호가 올바르지 않습니다."
            },
            {
                status: 400
            }
        );
    }

    const problem = await prisma.problem.findUnique({
        where: {
            number
        },
        include: {
            testCases: {
                where: {
                    isSample: true
                },
                orderBy: {
                    id: "asc"
                }
            },
            submissions: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 20
            },
            _count: {
                select: {
                    submissions: true
                }
            }
        }
    });

    if (!problem) {
        return NextResponse.json(
            {
                ok: false,
                message: "문제를 찾을 수 없습니다."
            },
            {
                status: 404
            }
        );
    }

    const acceptedCount = await prisma.submission.count({
        where: {
            problemId: problem.id,
            status: "accepted"
        }
    });

    const relatedProblems = await prisma.problem.findMany({
        where: {
            id: {
                not: problem.id
            },
            status: "published",
            OR: [
                {
                    category: problem.category
                },
                {
                    tags: {
                        hasSome: problem.tags
                    }
                }
            ]
        },
        orderBy: {
            recommendedOrder: "asc"
        },
        take: 5
    });

    return NextResponse.json({
        ok: true,
        problem: {
            dbId: problem.id,
            id: problem.number,
            number: problem.number,
            slug: problem.slug,
            title: problem.title,
            difficulty: normalizeDifficulty(problem.difficulty),
            category: problem.category,
            score: problem.score,
            status: normalizeProblemStatus(problem.status),
            solvedRate: problem.solvedRate,
            submissions: problem._count.submissions,
            accepted: acceptedCount,
            timeLimit: formatTimeLimit(problem.timeLimitMs),
            memoryLimit: formatMemoryLimit(problem.memoryLimitMb),
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
            compareMode: problem.compareMode,
            source: problem.source,
            tags: problem.tags,
            memo: problem.memo || problem.note || "",
            description: problem.description,
            inputDescription: problem.inputDescription,
            outputDescription: problem.outputDescription,
            constraints: problem.constraints,
            examples: problem.testCases.map((testCase) => ({
                id: testCase.id,
                input: testCase.input,
                output: testCase.output,
                explanation: testCase.explanation ?? undefined
            })),
            hints: problem.hints,
            recommendedOrder: problem.recommendedOrder
        },
        submissions: problem.submissions.map((submission) => ({
            id: submission.id,
            problemId: submission.problemId,
            status: submission.status,
            language: submission.language,
            executionTimeMs: submission.executionTimeMs,
            memoryKb: submission.memoryKb,
            code: submission.code,
            createdAt: submission.createdAt
        })),
        relatedProblems: relatedProblems.map((item) => ({
            dbId: item.id,
            id: item.number,
            number: item.number,
            slug: item.slug,
            title: item.title,
            difficulty: normalizeDifficulty(item.difficulty),
            category: item.category,
            score: item.score,
            status: normalizeProblemStatus(item.status),
            solvedRate: item.solvedRate,
            submissions: 0,
            accepted: 0,
            timeLimit: formatTimeLimit(item.timeLimitMs),
            memoryLimit: formatMemoryLimit(item.memoryLimitMb),
            timeLimitMs: item.timeLimitMs,
            memoryLimitMb: item.memoryLimitMb,
            compareMode: item.compareMode,
            source: item.source,
            tags: item.tags,
            memo: item.memo || item.note || "",
            description: item.description,
            inputDescription: item.inputDescription,
            outputDescription: item.outputDescription,
            constraints: item.constraints,
            examples: [],
            hints: item.hints,
            recommendedOrder: item.recommendedOrder
        }))
    });
}