// app/api/submissions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    formatDate,
    formatMemoryKb,
    toDifficulty
} from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
    params:
        | Promise<{
        id: string;
    }>
        | {
        id: string;
    };
};

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

function getDefaultCompileCommand(language: string) {
    const text = language.toLowerCase();

    if (text === "c") {
        return "gcc Main.c -O2 -std=c11 -Wall -Wextra -o main";
    }

    if (text === "cpp") {
        return "g++ Main.cpp -O2 -std=c++17 -Wall -Wextra -pipe -o main";
    }

    if (text === "java") {
        return "javac Main.java";
    }

    if (text === "csharp") {
        return "dotnet build Judge.csproj -c Release --nologo -v:q";
    }

    if (text === "dart") {
        return "dart compile exe Main.dart -o main";
    }

    return "-";
}

function getDefaultRunCommand(language: string) {
    const text = language.toLowerCase();

    if (text === "c" || text === "cpp" || text === "dart") {
        return "./main";
    }

    if (text === "python") {
        return "python3 Main.py";
    }

    if (text === "java") {
        return "java Main";
    }

    if (text === "javascript") {
        return "node Main.js";
    }

    if (text === "csharp") {
        return "dotnet ./bin/Release/net8.0/Judge.dll";
    }

    return "-";
}

function getDefaultCompileLog(status: string, resultMessage: string | null) {
    if (status === "compile") {
        return resultMessage ?? "컴파일 오류가 발생했습니다.";
    }

    if (status === "pending" || status === "judging") {
        return "아직 컴파일 로그가 없습니다.";
    }

    return "Compilation completed successfully.";
}

export async function GET(_request: NextRequest, context: Context) {
    try {
        const { id } = await Promise.resolve(context.params);
        const submissionId = Number(id);

        if (!Number.isFinite(submissionId) || submissionId <= 0) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "제출 번호가 올바르지 않습니다."
                },
                {
                    status: 400
                }
            );
        }

        const submission = await prisma.submission.findUnique({
            where: {
                id: submissionId
            },
            include: {
                problem: true,
                user: true
            }
        });

        if (!submission) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "제출을 찾을 수 없습니다."
                },
                {
                    status: 404
                }
            );
        }

        const problemNumber = submission.problem.number;
        const problemDbId = submission.problem.id;
        const codeLength = getCodeLength(submission.code);
        const resultMessage = submission.resultMessage ?? "채점 결과가 없습니다.";

        return NextResponse.json({
            ok: true,
            submission: {
                id: submission.id,

                // URL 라우팅용 문제 번호입니다. /problems/1000
                problemId: problemNumber,
                problemNumber,

                // DB 내부 PK입니다.
                problemDbId,

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

                userName:
                    submission.user?.name ??
                    submission.user?.handle ??
                    "guest",

                status: submission.status,
                language: submission.language,

                sourceFile: submission.sourceFile,
                code: submission.code,
                codeLength,

                time: getTimeText(submission.executionTimeMs),
                memory: formatMemoryKb(submission.memoryKb),

                timeMs: submission.executionTimeMs,
                executionTimeMs: submission.executionTimeMs,
                memoryKb: submission.memoryKb,

                resultMessage,
                message: resultMessage,
                note: resultMessage,

                testPassed: submission.testPassed,
                testTotal: submission.testTotal,

                workerId: submission.workerId,
                queueJobId: submission.queueJobId,

                submittedAt: submission.createdAt.toISOString(),
                submittedAtText: formatDate(submission.createdAt),

                judgedAt: submission.judgedAt?.toISOString() ?? null,
                judgedAtText: formatNullableDate(submission.judgedAt),

                compileCommand: getDefaultCompileCommand(submission.language),
                runCommand: getDefaultRunCommand(submission.language),
                compileLog: getDefaultCompileLog(
                    submission.status,
                    submission.resultMessage
                ),

                judgeLog: [
                    `Submission #${submission.id}`,
                    `Status: ${submission.status}`,
                    `Language: ${submission.language}`,
                    `Problem: ${problemNumber}. ${submission.problem.title}`,
                    `Submitted: ${formatDate(submission.createdAt)}`,
                    `Judged: ${formatNullableDate(submission.judgedAt)}`,
                    `Result: ${resultMessage}`
                ],

                // 현재 DB에 테스트 케이스별 결과 테이블이 없다면 빈 배열로 내려줍니다.
                // 나중에 SubmissionCaseResult 같은 테이블을 만들면 여기에 매핑하면 됩니다.
                cases: [],
                testResults: [],

                href: `/submissions/${submission.id}`,
                problemHref: `/problems/${problemNumber}`,
                problemSubmissionsHref: `/problems/${problemNumber}/submissions`
            }
        });
    } catch (error) {
        console.error("Failed to load submission detail", error);

        return NextResponse.json(
            {
                ok: false,
                message: "제출 상세 정보를 불러오지 못했습니다."
            },
            {
                status: 500
            }
        );
    }
}