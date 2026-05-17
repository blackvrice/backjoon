import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    if (!Number.isFinite(ms) || ms <= 0) return "1초";

    if (ms % 1000 === 0) {
        return `${ms / 1000}초`;
    }

    return `${ms}ms`;
}

function formatMemoryLimit(mb: number) {
    if (!Number.isFinite(mb) || mb <= 0) return "256MB";

    return `${mb}MB`;
}

function normalizeDifficulty(value: string) {
    if (value === "Easy" || value === "Medium" || value === "Hard") {
        return value;
    }

    if (value === "초급") return "Easy";
    if (value === "중급") return "Medium";
    if (value === "고급") return "Hard";

    return "Easy";
}

function normalizeProblemStatus(value: string) {
    if (
        value === "solved" ||
        value === "wrong" ||
        value === "todo" ||
        value === "review"
    ) {
        return value;
    }

    return "todo";
}

export async function GET(_request: Request, context: RouteContext) {
    const params = await Promise.resolve(context.params);
    const number = Number(params.id);

    if (!Number.isFinite(number) || number <= 0) {
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

    const problem = await prisma.problem.findFirst({
        where: {
            number
        },
        include: {
            submissions: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 100
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
                message: `#${number} 문제를 찾을 수 없습니다.`
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

    return NextResponse.json({
        ok: true,
        problem: {
            dbId: problem.id,
            id: problem.number,
            number: problem.number,
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
            tags: problem.tags,
            memo: problem.memo || problem.note || ""
        },
        submissions: problem.submissions.map((submission) => ({
            id: submission.id,
            problemId: submission.problemId,
            status: submission.status,
            language: submission.language,
            executionTimeMs: submission.executionTimeMs,
            memoryKb: submission.memoryKb,
            code: submission.code,
            resultMessage: submission.resultMessage,
            createdAt: submission.createdAt
        }))
    });
}