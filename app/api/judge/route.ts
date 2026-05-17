// app/api/judge/route.ts

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
    getLanguageConfig,
    normalizeLanguage,
    type JudgeLanguage,
} from "@/server/judge/languageConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JudgeMode = "run" | "submit";

type JudgeStatus =
    | "accepted"
    | "wrong"
    | "compile"
    | "runtime"
    | "timeLimit"
    | "memoryLimit"
    | "pending"
    | "judging";

type JudgeTest = {
    id?: string;
    label?: string;
    input?: string;
    expectedOutput?: string;
};

type Body = {
    mode?: JudgeMode;
    problemId?: number | string;
    problemNumber?: number | string;
    problemTitle?: string;
    language?: string;
    sourceFile?: string;
    code?: string;
    tests?: JudgeTest[];
    timeLimitMs?: number;
    memoryLimitMb?: number;
    compareMode?: string;
    userHandle?: string;
    ip?: string;
};

type DockerResult = {
    exitCode: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
};

type JudgeCaseResult = {
    id: string;
    label: string;
    status: JudgeStatus;
    timeMs: number;
    memoryKb?: number;
    message: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
};

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

function normalizeOutput(value: string) {
    return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
}

function compareOutput(actual: string, expected: string) {
    return normalizeOutput(actual) === normalizeOutput(expected);
}

function getMemoryLimit(memoryLimitMb?: number) {
    const value = Number(memoryLimitMb);

    if (!Number.isFinite(value) || value <= 0) {
        return 256;
    }

    return Math.min(Math.max(Math.floor(value), 64), 2048);
}

function getTimeLimit(timeLimitMs?: number) {
    const value = Number(timeLimitMs);

    if (!Number.isFinite(value) || value <= 0) {
        return 2000;
    }

    return Math.min(Math.max(Math.floor(value), 500), 15000);
}

function getDefaultTests(tests?: JudgeTest[]) {
    if (Array.isArray(tests) && tests.length > 0) {
        return tests;
    }

    return [
        {
            id: "empty-1",
            label: "기본 실행",
            input: "",
            expectedOutput: "",
        },
    ];
}

function getOverallStatus(results: JudgeCaseResult[]): JudgeStatus {
    if (results.some((item) => item.status === "compile")) return "compile";
    if (results.some((item) => item.status === "runtime")) return "runtime";
    if (results.some((item) => item.status === "timeLimit")) return "timeLimit";
    if (results.some((item) => item.status === "memoryLimit")) return "memoryLimit";
    if (results.some((item) => item.status === "wrong")) return "wrong";

    return "accepted";
}

function getOverallMessage(status: JudgeStatus) {
    switch (status) {
        case "accepted":
            return "실행이 완료되었습니다.";
        case "wrong":
            return "출력이 정답과 다릅니다.";
        case "compile":
            return "컴파일 오류가 발생했습니다.";
        case "runtime":
            return "런타임 에러가 발생했습니다.";
        case "timeLimit":
            return "시간 제한을 초과했습니다.";
        case "memoryLimit":
            return "메모리 제한을 초과했습니다.";
        default:
            return "실행 결과를 확인하세요.";
    }
}

function getDockerMountPath(dir: string) {
    return process.platform === "win32" ? dir.replace(/\\/g, "/") : dir;
}

function runDocker({
                       image,
                       workdir,
                       command,
                       input,
                       timeoutMs,
                       memoryLimitMb,
                   }: {
    image: string;
    workdir: string;
    command: string;
    input?: string;
    timeoutMs: number;
    memoryLimitMb: number;
}): Promise<DockerResult> {
    return new Promise((resolve) => {
        const args = [
            "run",
            "--rm",
            "-i",
            "--network",
            "none",
            "--memory",
            `${memoryLimitMb}m`,
            "--cpus",
            "1",
            "-v",
            `${getDockerMountPath(workdir)}:/workspace`,
            "-w",
            "/workspace",
            image,
            "sh",
            "-lc",
            command,
        ];

        const child = spawn("docker", args, {
            stdio: ["pipe", "pipe", "pipe"],
            shell: false,
        });

        let stdout = "";
        let stderr = "";
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;

            settled = true;
            child.kill("SIGKILL");

            resolve({
                exitCode: null,
                stdout,
                stderr,
                timedOut: true,
            });
        }, timeoutMs);

        child.stdout.on("data", (chunk: Buffer) => {
            stdout += chunk.toString("utf8");
        });

        child.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString("utf8");
        });

        child.on("error", (error) => {
            if (settled) return;

            settled = true;
            clearTimeout(timer);

            resolve({
                exitCode: null,
                stdout,
                stderr:
                    error.message ||
                    "Docker 실행 중 오류가 발생했습니다. Docker Desktop이 실행 중인지 확인하세요.",
                timedOut: false,
            });
        });

        child.on("close", (code) => {
            if (settled) return;

            settled = true;
            clearTimeout(timer);

            resolve({
                exitCode: code,
                stdout,
                stderr,
                timedOut: false,
            });
        });

        child.stdin.write(input ?? "");
        child.stdin.end();
    });
}

async function runJudgeImmediately({
                                       language,
                                       sourceFile,
                                       code,
                                       tests,
                                       timeLimitMs,
                                       memoryLimitMb,
                                   }: {
    language: JudgeLanguage;
    sourceFile?: string;
    code?: string;
    tests?: JudgeTest[];
    timeLimitMs?: number;
    memoryLimitMb?: number;
    compareMode?: string;
}): Promise<{
    status: JudgeStatus;
    message: string;
    results: JudgeCaseResult[];
}> {
    const config = getLanguageConfig(language);

    if (!config) {
        return {
            status: "runtime",
            message: `지원하지 않는 언어입니다: ${language}`,
            results: [],
        };
    }

    const fileName = safeSourceFile(sourceFile, config.fileName);
    const memoryLimit = getMemoryLimit(memoryLimitMb);
    const timeLimit = getTimeLimit(timeLimitMs);

    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "backjoon-run-"));
    const sourcePath = path.join(workspace, fileName);

    try {
        await fs.writeFile(sourcePath, String(code ?? ""), "utf8");

        if (config.fileName !== fileName) {
            await fs.copyFile(sourcePath, path.join(workspace, config.fileName));
        }

        if (config.compileCommand) {
            const compileResult = await runDocker({
                image: config.dockerImage,
                workdir: workspace,
                command: config.compileCommand,
                timeoutMs: Math.max(timeLimit, 15000),
                memoryLimitMb: memoryLimit,
            });

            if (compileResult.timedOut) {
                return {
                    status: "compile",
                    message: "컴파일 시간이 초과되었습니다.",
                    results: [
                        {
                            id: "compile",
                            label: "컴파일",
                            status: "compile",
                            timeMs: 0,
                            message: "컴파일 시간이 초과되었습니다.",
                            input: "",
                            expectedOutput: "",
                            actualOutput: compileResult.stderr || compileResult.stdout,
                        },
                    ],
                };
            }

            if (compileResult.exitCode !== 0) {
                return {
                    status: "compile",
                    message: "컴파일 오류가 발생했습니다.",
                    results: [
                        {
                            id: "compile",
                            label: "컴파일",
                            status: "compile",
                            timeMs: 0,
                            message:
                                compileResult.stderr ||
                                compileResult.stdout ||
                                "컴파일 오류가 발생했습니다.",
                            input: "",
                            expectedOutput: "",
                            actualOutput: compileResult.stderr || compileResult.stdout,
                        },
                    ],
                };
            }
        }

        const testCases = getDefaultTests(tests);
        const results: JudgeCaseResult[] = [];

        for (let index = 0; index < testCases.length; index += 1) {
            const test = testCases[index];
            const input = String(test.input ?? "");
            const expectedOutput = String(test.expectedOutput ?? "");
            const startedAt = Date.now();

            const runResult = await runDocker({
                image: config.dockerImage,
                workdir: workspace,
                command: config.runCommand,
                input,
                timeoutMs: timeLimit,
                memoryLimitMb: memoryLimit,
            });

            const elapsedMs = Date.now() - startedAt;

            if (runResult.timedOut) {
                results.push({
                    id: test.id ?? `case-${index + 1}`,
                    label: test.label ?? `테스트 ${index + 1}`,
                    status: "timeLimit",
                    timeMs: elapsedMs,
                    message: "시간 제한을 초과했습니다.",
                    input,
                    expectedOutput,
                    actualOutput: runResult.stdout,
                });
                continue;
            }

            if (runResult.exitCode === 137) {
                results.push({
                    id: test.id ?? `case-${index + 1}`,
                    label: test.label ?? `테스트 ${index + 1}`,
                    status: "memoryLimit",
                    timeMs: elapsedMs,
                    message: "메모리 제한을 초과했습니다.",
                    input,
                    expectedOutput,
                    actualOutput: runResult.stdout || runResult.stderr,
                });
                continue;
            }

            if (runResult.exitCode !== 0) {
                results.push({
                    id: test.id ?? `case-${index + 1}`,
                    label: test.label ?? `테스트 ${index + 1}`,
                    status: "runtime",
                    timeMs: elapsedMs,
                    message: runResult.stderr || "런타임 에러가 발생했습니다.",
                    input,
                    expectedOutput,
                    actualOutput: runResult.stdout,
                });
                continue;
            }

            const hasExpectedOutput = expectedOutput.trim().length > 0;
            const accepted =
                !hasExpectedOutput || compareOutput(runResult.stdout, expectedOutput);

            results.push({
                id: test.id ?? `case-${index + 1}`,
                label: test.label ?? `테스트 ${index + 1}`,
                status: accepted ? "accepted" : "wrong",
                timeMs: elapsedMs,
                message: accepted
                    ? hasExpectedOutput
                        ? "정답입니다."
                        : "실행이 완료되었습니다."
                    : "출력이 정답과 다릅니다.",
                input,
                expectedOutput,
                actualOutput: runResult.stdout,
            });
        }

        const status = getOverallStatus(results);

        return {
            status,
            message: getOverallMessage(status),
            results,
        };
    } finally {
        await fs.rm(workspace, {
            recursive: true,
            force: true,
        });
    }
}

export async function POST(request: Request) {
    let body: Body;

    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json(
            {
                ok: false,
                status: "runtime",
                message: "요청 JSON을 읽을 수 없습니다.",
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
                message: `지원하지 않는 언어입니다: ${body.language}`,
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
                message: `언어 설정을 찾을 수 없습니다: ${normalizedLanguage}`,
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
                message: "실행할 코드가 없습니다.",
                results: [],
            },
            {
                status: 400,
            },
        );
    }

    const sourceFile = safeSourceFile(body.sourceFile, config.fileName);

    if (mode === "run") {
        const result = await runJudgeImmediately({
            language: normalizedLanguage,
            code,
            sourceFile,
            tests: body.tests,
            timeLimitMs: body.timeLimitMs,
            memoryLimitMb: body.memoryLimitMb,
            compareMode: body.compareMode,
        });

        return NextResponse.json(
            {
                ok: true,
                mode: "run",
                status: result.status,
                message: result.message,
                results: result.results,
            },
            {
                status: 200,
            },
        );
    }

    const problemId = Number(body.problemId);

    if (!Number.isFinite(problemId) || problemId <= 0) {
        return NextResponse.json(
            {
                ok: false,
                mode: "submit",
                status: "runtime",
                message: "problemId가 올바르지 않습니다.",
            },
            {
                status: 400,
            },
        );
    }

    const queueJobId = randomUUID();

    const submission = await prisma.submission.create({
        data: {
            problemId,
            language: normalizedLanguage,
            sourceFile,
            code,
            status: "pending",
            queueJobId,
        },
    });

    return NextResponse.json(
        {
            ok: true,
            mode: "submit",
            status: "pending",
            submissionId: submission.id,
            queueJobId,
            message:
                "제출이 DB 큐에 등록되었습니다. judgeWorker가 pending 제출을 가져가 채점합니다.",
            href: `/submissions/${submission.id}`,
        },
        {
            status: 201,
        },
    );
}