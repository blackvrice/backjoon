// app/api/submissions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    formatDate,
    formatMemoryKb,
    toDifficulty
} from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSafeLimit(value: string | null) {
    const parsed = Number(value ?? 200);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 200;
    }

    return Math.min(parsed, 500);
}

function formatNullableDate(value: Date | null | undefined) {
    if (!value) {
        return "-";
    }

    return formatDate(value);
}

function getCodeLength(code: string | null | undefined) {
    return typeof code === "string" ? code.length : 0;
}

function getTimeText(timeMs: number | null | undefined) {
    return typeof timeMs === "number" ? `${timeMs}ms` : "-";
}

export async function GET(request: NextRequest) {
    try {
        const limit = toSafeLimit(request.nextUrl.searchParams.get("limit"));

        const submissions = await prisma.submission.findMany({
            include: {
                problem: true,
                user: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit
        });

        return NextResponse.json({
            ok: true,
            submissions: submissions.map((submission) => {
                const problemNumber = submission.problem.number;
                const problemDbId = submission.problem.id;
                const codeLength = getCodeLength(submission.code);

                return {
                    id: submission.id,

                    // 화면 라우팅 호환용입니다.
                    // /problems/1000 으로 이동해야 하므로 problemId는 문제 번호로 둡니다.
                    problemId: problemNumber,

                    // DB 내부 PK가 필요할 때 사용합니다.
                    problemDbId,
                    problemNumber,
                    problemTitle: submission.problem.title,

                    problem: {
                        id: problemDbId,
                        number: problemNumber,
                        title: submission.problem.title,
                        difficulty: toDifficulty(submission.problem.difficulty),
                        category: submission.problem.category,
                        score: submission.problem.score,
                        tags: submission.problem.tags,
                        timeLimitMs: submission.problem.timeLimitMs,
                        memoryLimitMb: submission.problem.memoryLimitMb
                    },

                    difficulty: toDifficulty(submission.problem.difficulty),
                    user:
                        submission.user?.handle ??
                        submission.user?.name ??
                        "guest",

                    status: submission.status,
                    language: submission.language,

                    timeMs: submission.executionTimeMs,
                    executionTimeMs: submission.executionTimeMs,
                    memoryKb: submission.memoryKb,

                    time: getTimeText(submission.executionTimeMs),
                    memory: formatMemoryKb(submission.memoryKb),

                    codeLength,
                    code: submission.code,
                    sourceFile: submission.sourceFile,

                    submittedAt: submission.createdAt.toISOString(),
                    submittedAtText: formatDate(submission.createdAt),
                    judgedAt: submission.judgedAt?.toISOString() ?? null,
                    judgedAtText: formatNullableDate(submission.judgedAt),

                    score: submission.status === "accepted" ? submission.problem.score : 0,
                    message: submission.resultMessage ?? "-",
                    resultMessage: submission.resultMessage ?? "-",

                    href: `/submissions/${submission.id}`,
                    problemHref: `/problems/${problemNumber}`
                };
            })
        });
    } catch (error) {
        console.error("Failed to load submissions", error);

        return NextResponse.json(
            {
                ok: false,
                message: "제출 기록을 불러오지 못했습니다.",
                submissions: []
            },
            {
                status: 500
            }
        );
    }
}