import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptedRate, formatDate, formatMemoryLimit, formatTimeLimit, toDifficulty } from "@/lib/api-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> | { id: string } };

function toProblemStatus(status: string | undefined) {
    if (status === "accepted") return "solved";
    if (status === "wrong") return "wrong";
    if (status === "review") return "review";
    return "todo";
}

function createDefaultCodes(title: string) {
    return {
        "C++17": `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // ${title}
    return 0;
}
`,
        "Python 3.12": `# ${title}
`,
        "Java 17": `public class Main {
    public static void main(String[] args) throws Exception {
        // ${title}
    }
}
`,
        JavaScript: `// ${title}
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
`,
        Dart: `import 'dart:io';

void main() {
  // ${title}
}
`,
        "C# 12": `using System;

public class Program
{
    public static void Main()
    {
        // ${title}
    }
}
`,
    };
}

export async function GET(_request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);
    const numeric = Number(id);
    const test = await prisma.studyTest.findFirst({
        where: Number.isFinite(numeric) ? { OR: [{ id: numeric }, { slug: id }] } : { slug: id },
        include: {
            items: {
                include: {
                    problem: {
                        include: {
                            testCases: { where: { isSample: true }, orderBy: { id: "asc" } },
                            submissions: { orderBy: { createdAt: "desc" }, take: 20 },
                            _count: { select: { submissions: true } },
                        },
                    },
                },
                orderBy: { order: "asc" },
            },
            attempts: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 },
        },
    });

    if (!test) {
        return NextResponse.json({ message: "테스트를 찾을 수 없습니다." }, { status: 404 });
    }

    const latestAttempt = test.attempts[0] ?? null;
    const totalScore = test.items.reduce((sum, item) => sum + item.score, 0);
    const solved = test.items.reduce((sum, item) => {
        const accepted = item.problem.submissions.some((submission) => submission.status === "accepted");
        return sum + (accepted ? 1 : 0);
    }, 0);

    const problems = test.items.map((item) => {
        const latestSubmission = item.problem.submissions[0];
        const accepted = item.problem.submissions.filter((submission) => submission.status === "accepted").length;
        const total = item.problem._count.submissions;

        return {
            order: item.order,
            dbId: item.problem.id,
            id: item.problem.number,
            number: item.problem.number,
            title: item.problem.title,
            difficulty: toDifficulty(item.problem.difficulty),
            category: item.problem.category,
            score: item.problem.score,
            points: item.score,
            status: toProblemStatus(latestSubmission?.status),
            solvedRate: acceptedRate(total, accepted) || item.problem.solvedRate,
            submissions: total,
            accepted,
            timeLimit: formatTimeLimit(item.problem.timeLimitMs),
            memoryLimit: formatMemoryLimit(item.problem.memoryLimitMb),
            timeLimitMs: item.problem.timeLimitMs,
            memoryLimitMb: item.problem.memoryLimitMb,
            compareMode: item.problem.compareMode,
            tags: item.problem.tags,
            memo: item.problem.memo || item.problem.note,
            description: item.problem.description,
            inputDescription: item.problem.inputDescription,
            outputDescription: item.problem.outputDescription,
            constraints: item.problem.constraints,
            hints: item.problem.hints,
            examples: item.problem.testCases.map((testCase) => ({
                input: testCase.input,
                output: testCase.output,
                explanation: testCase.explanation ?? "",
            })),
            defaultCodes: createDefaultCodes(item.problem.title),
            required: true,
            estimatedMinutes: Math.max(10, Math.round(test.durationMin / Math.max(test.items.length, 1))),
            reason: item.problem.note || item.problem.memo || "DB에 등록된 테스트 문제입니다.",
            href: `/problems/${item.problem.number}`,
            solveHref: `/problems/${item.problem.number}/solve`,
        };
    });

    return NextResponse.json({
        test: {
            id: test.slug,
            dbId: test.id,
            title: test.title,
            description: test.description,
            type: test.type,
            category: test.type,
            status: test.status,
            durationMin: test.durationMin,
            durationMinutes: test.durationMin,
            difficulty: toDifficulty(test.difficulty),
            tags: test.tags,
            recommended: true,
            featured: false,
            totalScore,
            myScore: latestAttempt?.score ?? null,
            participants: test.attempts.length,
            averageScore: latestAttempt?.totalScore ? latestAttempt.score : 0,
            rank: null,
            startAt: test.createdAt.toISOString(),
            startAtText: formatDate(test.createdAt),
            endAt: test.updatedAt.toISOString(),
            endAtText: formatDate(test.updatedAt),
            updatedAt: test.updatedAt.toISOString(),
            companies: [],
            rules: [
                "DB에 등록된 문제와 예제 테스트 케이스를 기준으로 응시합니다.",
                "제출 결과는 Submission 테이블과 judge worker 결과를 기준으로 집계합니다.",
            ],
            guide: [
                "문제를 순서대로 읽고 쉬운 문제부터 해결하세요.",
                "예제 실행 후 제출하면 채점 대기열에 등록됩니다.",
            ],
            analysis: [
                { title: "진행", description: "DB 제출 현황 기준입니다.", value: `${solved} / ${test.items.length}`, tone: "blue" },
                { title: "총점", description: "테스트 배점 합계입니다.", value: `${totalScore}`, tone: "green" },
            ],
            problems,
            remainingSeconds: test.durationMin * 60,
        },
        problems,
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
