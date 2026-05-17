import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

type TestCasePayload = {
    id?: number;
    input?: string;
    output?: string;
    explanation?: string;
    isSample?: boolean;
    isHidden?: boolean;
    isVerified?: boolean;
};

type ProblemPayload = {
    number?: number;
    slug?: string;
    title?: string;
    description?: string;
    inputDescription?: string;
    outputDescription?: string;
    constraints?: string[];
    hints?: string[];
    difficulty?: string;
    category?: string;
    score?: number;
    source?: string;
    status?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
    compareMode?: string;
    tags?: string[];
    note?: string;
    memo?: string;
    recommendedOrder?: number;
    solvedRate?: number;
    authorEmail?: string;
    reviewerEmail?: string;
    reviewMessage?: string;
    testCases?: TestCasePayload[];
};

function toStringArray(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function toSafeNumber(value: unknown, fallback: number) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return parsed;
}

function normalizeDifficulty(value: unknown) {
    const text = String(value ?? "Easy");

    if (text === "Easy" || text === "Medium" || text === "Hard") {
        return text;
    }

    return "Easy";
}

function normalizeStatus(value: unknown) {
    const text = String(value ?? "published");

    if (text === "published" || text === "draft" || text === "archived") {
        return text;
    }

    return "published";
}

function normalizeCompareMode(value: unknown) {
    const text = String(value ?? "default");

    if (text === "default" || text === "exact" || text === "token") {
        return text;
    }

    return "default";
}

async function findProblemByRouteId(id: string) {
    const number = Number(id);

    if (!Number.isFinite(number) || number <= 0) {
        return null;
    }

    return prisma.problem.findUnique({
        where: {
            number
        },
        include: {
            testCases: {
                orderBy: {
                    id: "asc"
                }
            },
            _count: {
                select: {
                    submissions: true
                }
            }
        }
    });
}

function toProblemResponse(problem: NonNullable<Awaited<ReturnType<typeof findProblemByRouteId>>>) {
    return {
        dbId: problem.id,
        number: problem.number,
        slug: problem.slug,
        title: problem.title,
        description: problem.description,
        inputDescription: problem.inputDescription,
        outputDescription: problem.outputDescription,
        constraints: problem.constraints,
        hints: problem.hints,
        difficulty: problem.difficulty,
        category: problem.category,
        score: problem.score,
        source: problem.source,
        status: problem.status,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        compareMode: problem.compareMode,
        tags: problem.tags,
        note: problem.note,
        memo: problem.memo,
        recommendedOrder: problem.recommendedOrder,
        solvedRate: problem.solvedRate,
        authorEmail: problem.authorEmail,
        reviewerEmail: problem.reviewerEmail ?? "",
        reviewMessage: problem.reviewMessage ?? "",
        submissionsCount: problem._count.submissions,
        testCases: problem.testCases.map((testCase) => ({
            id: testCase.id,
            input: testCase.input,
            output: testCase.output,
            explanation: testCase.explanation ?? "",
            isSample: testCase.isSample,
            isHidden: testCase.isHidden,
            isVerified: testCase.isVerified
        }))
    };
}

export async function GET(_request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);

    const problem = await findProblemByRouteId(id);

    if (!problem) {
        return NextResponse.json(
            {
                ok: false,
                message: `#${id} 문제를 찾을 수 없습니다.`
            },
            {
                status: 404
            }
        );
    }

    return NextResponse.json({
        ok: true,
        problem: toProblemResponse(problem)
    });
}

export async function PATCH(request: NextRequest, context: Context) {
    const { id } = await Promise.resolve(context.params);

    const currentProblem = await prisma.problem.findUnique({
        where: {
            number: Number(id)
        }
    });

    if (!currentProblem) {
        return NextResponse.json(
            {
                ok: false,
                message: `#${id} 문제를 찾을 수 없습니다.`
            },
            {
                status: 404
            }
        );
    }

    let body: ProblemPayload;

    try {
        body = (await request.json()) as ProblemPayload;
    } catch {
        return NextResponse.json(
            {
                ok: false,
                message: "요청 JSON을 읽을 수 없습니다."
            },
            {
                status: 400
            }
        );
    }

    const nextNumber = toSafeNumber(body.number, currentProblem.number);
    const testCases = Array.isArray(body.testCases) ? body.testCases : [];
    const existingTestCaseIds = testCases
        .map((item) => Number(item.id))
        .filter((item) => Number.isFinite(item) && item > 0);

    try {
        await prisma.$transaction(async (tx) => {
            await tx.problem.update({
                where: {
                    id: currentProblem.id
                },
                data: {
                    number: nextNumber,
                    slug: String(body.slug ?? currentProblem.slug),
                    title: String(body.title ?? currentProblem.title),
                    description: String(body.description ?? ""),
                    inputDescription: String(body.inputDescription ?? ""),
                    outputDescription: String(body.outputDescription ?? ""),
                    constraints: toStringArray(body.constraints),
                    hints: toStringArray(body.hints),
                    difficulty: normalizeDifficulty(body.difficulty),
                    category: String(body.category ?? "구현"),
                    score: toSafeNumber(body.score, 100),
                    source: String(body.source ?? "Local"),
                    status: normalizeStatus(body.status),
                    timeLimitMs: toSafeNumber(body.timeLimitMs, 2000),
                    memoryLimitMb: toSafeNumber(body.memoryLimitMb, 256),
                    compareMode: normalizeCompareMode(body.compareMode),
                    tags: toStringArray(body.tags),
                    note: String(body.note ?? ""),
                    memo: String(body.memo ?? ""),
                    recommendedOrder: toSafeNumber(body.recommendedOrder, 0),
                    solvedRate: toSafeNumber(body.solvedRate, 0),
                    authorEmail: String(body.authorEmail ?? "admin@local"),
                    reviewerEmail: body.reviewerEmail ? String(body.reviewerEmail) : null,
                    reviewMessage: body.reviewMessage ? String(body.reviewMessage) : null
                }
            });

            await tx.testCase.deleteMany({
                where: {
                    problemId: currentProblem.id,
                    ...(existingTestCaseIds.length > 0
                        ? {
                            id: {
                                notIn: existingTestCaseIds
                            }
                        }
                        : {})
                }
            });

            for (const testCase of testCases) {
                const testCaseId = Number(testCase.id);
                const data = {
                    input: String(testCase.input ?? ""),
                    output: String(testCase.output ?? ""),
                    explanation: testCase.explanation
                        ? String(testCase.explanation)
                        : null,
                    isSample: Boolean(testCase.isSample),
                    isHidden: Boolean(testCase.isHidden),
                    isVerified: testCase.isVerified !== false
                };

                if (Number.isFinite(testCaseId) && testCaseId > 0) {
                    await tx.testCase.update({
                        where: {
                            id: testCaseId
                        },
                        data
                    });
                } else {
                    await tx.testCase.create({
                        data: {
                            ...data,
                            problemId: currentProblem.id
                        }
                    });
                }
            }
        });

        const saved = await prisma.problem.findUnique({
            where: {
                number: nextNumber
            },
            include: {
                testCases: {
                    orderBy: {
                        id: "asc"
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });

        if (!saved) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "저장 후 문제를 다시 불러오지 못했습니다."
                },
                {
                    status: 500
                }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "문제를 저장했습니다.",
            problem: toProblemResponse(saved)
        });
    } catch (error) {
        console.error("Failed to save admin problem", error);

        return NextResponse.json(
            {
                ok: false,
                message: "문제 저장 중 오류가 발생했습니다. 문제 번호나 slug 중복을 확인하세요."
            },
            {
                status: 500
            }
        );
    }
}