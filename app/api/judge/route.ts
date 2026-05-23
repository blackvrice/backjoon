// app/api/judge/route.ts

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getLanguageConfig, normalizeLanguage } from "@/server/judge/languageConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JudgeMode = "run" | "submit";

type Body = {
    mode?: JudgeMode;
    problemId?: number | string;
    problemNumber?: number | string;
    problemTitle?: string;
    language?: string;
    sourceFile?: string;
    code?: string;
    tests?: unknown[];
    timeLimitMs?: number;
    memoryLimitMb?: number;
    compareMode?: string;
    userHandle?: string;
    ip?: string;
};

const JUDGE_RUNNER_URL =
    process.env.JUDGE_RUNNER_URL?.trim() || "http://judge-api:4002/run";

function safeSourceFile(sourceFile: unknown, fallback: string) {
    const value = String(sourceFile ?? fallback).trim();

    if (
        !value ||
        value.includes("/") ||
        value.includes("\\") ||
        value.includes("..")
    ) {
        return fallback;
    }

    return value;
}

export async function POST(request: Request) {
    const currentUser = await getCurrentUser();
    let body: Body;

    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json(
            {
                ok: false,
                status: "runtime",
                message: "Request body must be valid JSON.",
            },
            {
                status: 400,
            },
        );
    }

    const mode: JudgeMode = body.mode === "submit" ? "submit" : "run";
    const normalizedLanguage = normalizeLanguage(body.language ?? "cpp");

    if (!normalizedLanguage) {
        return NextResponse.json(
            {
                ok: false,
                mode,
                status: "runtime",
                message: `Unsupported language: ${body.language}`,
                results: [],
            },
            {
                status: 400,
            },
        );
    }

    const config = getLanguageConfig(normalizedLanguage);

    if (!config) {
        return NextResponse.json(
            {
                ok: false,
                mode,
                status: "runtime",
                message: `Language config not found: ${normalizedLanguage}`,
                results: [],
            },
            {
                status: 400,
            },
        );
    }

    const code = String(body.code ?? "");

    if (!code.trim()) {
        return NextResponse.json(
            {
                ok: false,
                mode,
                status: "runtime",
                message: "No code was provided.",
                results: [],
            },
            {
                status: 400,
            },
        );
    }

    const problemId = Number(body.problemId);

    if (!Number.isFinite(problemId) || problemId <= 0) {
        return NextResponse.json(
            {
                ok: false,
                mode,
                status: "runtime",
                message: "problemId is invalid.",
            },
            {
                status: 400,
            },
        );
    }

    const sourceFile = safeSourceFile(body.sourceFile, config.fileName);

    if (mode === "run") {
        try {
            const response = await fetch(JUDGE_RUNNER_URL, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    language: normalizedLanguage,
                    sourceFile,
                    code,
                    tests: body.tests,
                    timeLimitMs: body.timeLimitMs,
                    memoryLimitMb: body.memoryLimitMb,
                    compareMode: body.compareMode,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                return NextResponse.json(
                    data ?? {
                        ok: false,
                        mode: "run",
                        status: "runtime",
                        message: "Judge runner failed.",
                        results: [],
                    },
                    {
                        status: 502,
                    },
                );
            }

            return NextResponse.json(data, {
                status: 200,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Judge runner is not available.";

            return NextResponse.json(
                {
                    ok: false,
                    mode: "run",
                    status: "runtime",
                    message,
                    results: [],
                },
                {
                    status: 502,
                },
            );
        }
    }

    const queueJobId = randomUUID();
    const resultMessage = "Submission queued. judgeWorker will execute it.";

    const submission = await prisma.submission.create({
        data: {
            problemId,
            userId: currentUser?.id,
            language: normalizedLanguage,
            sourceFile,
            code,
            status: "pending",
            resultMessage,
            queueJobId,
            ip: String(body.ip ?? "127.0.0.1"),
        },
    });

    return NextResponse.json(
        {
            ok: true,
            mode: "submit",
            status: "pending",
            submissionId: submission.id,
            queueJobId,
            message: resultMessage,
            href: `/submissions/${submission.id}`,
            results: [],
        },
        {
            status: 201,
        },
    );
}
