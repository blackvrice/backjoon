// server/judge/judgeWorker.ts

import {
    compareOutput,
    createOutputDiffMessage,
    type OutputCompareMode,
} from "./compareOutput";

import { getLanguageConfig } from "./languageConfig";

import {
    createWorkspace,
    removeWorkspace,
    writeInputFile,
    writeSourceFile,
    cleanupOldWorkspaces,
} from "./workspace";

import {
    runInDocker,
    isMemoryLimitExceeded,
    cleanRunMessage,
    checkDockerAvailable,
    pullDockerImage,
} from "./judgeRunner";

import { prisma } from "@/lib/prisma";

type JudgeInternalStatus =
    | "pending"
    | "judging"
    | "accepted"
    | "wrong"
    | "compile"
    | "runtime"
    | "timeout"
    | "memory";

type SubmissionDbStatus =
    | "pending"
    | "judging"
    | "accepted"
    | "wrong"
    | "compile"
    | "runtime"
    | "timeLimit"
    | "memoryLimit";

interface SubmissionForJudge {
    id: number;
    problemId: number;
    userId?: number | null;
    language: string;
    code: string;
    status: string;
    createdAt?: Date;
}

interface ProblemForJudge {
    id: number;
    timeLimitMs?: number | null;
    timeLimit?: number | null;
    memoryLimitMb?: number | null;
    memoryLimit?: number | null;
    compareMode?: string | null;
}

interface TestCaseForJudge {
    id: number;
    problemId: number;
    input: string | null;
    output: string | null;
    isSample?: boolean | null;
}

interface JudgeResult {
    status: JudgeInternalStatus;
    resultMessage: string;
    executionTimeMs?: number | null;
    memoryKb?: number | null;
    testPassed?: number;
    testTotal?: number;
}

const WORKER_CONFIG = {
    pollIntervalMs: 1000,
    compileTimeoutMs: 30_000,
    defaultTimeLimitMs: 2000,
    defaultMemoryLimitMb: 128,
    runtimeTimeoutBufferMs: 1000,
    staleJudgingMs: 1000 * 60 * 30,
    cpuLimit: "1",
    stdoutLimitBytes: 10 * 1024 * 1024,
    stderrLimitBytes: 10 * 1024 * 1024,
    preloadImages: false,
};

/** Worker 시작점 */
async function main() {
    console.log("[JudgeWorker] started");

    const dockerAvailable = await checkDockerAvailable();

    if (!dockerAvailable) {
        console.error("[JudgeWorker] Docker is not available.");
        console.error("[JudgeWorker] Docker Desktop을 실행했는지 확인하세요.");
        process.exit(1);
    }

    await cleanupOldWorkspaces();
    await releaseStaleJudgingSubmissions();

    if (WORKER_CONFIG.preloadImages) {
        await preloadDockerImages();
    }

    process.on("SIGINT", () => {
        void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
        void shutdown("SIGTERM");
    });

    while (true) {
        try {
            const submission = await claimNextPendingSubmission();

            if (!submission) {
                await sleep(WORKER_CONFIG.pollIntervalMs);
                continue;
            }

            console.log(`[JudgeWorker] judging submission=${submission.id}`);

            const result = await judgeSubmission(submission);

            await updateSubmissionResult(submission, result);

            console.log(
                `[JudgeWorker] done submission=${submission.id}, status=${normalizeFinalStatus(result.status)}`,
            );
        } catch (error) {
            console.error("[JudgeWorker] unexpected error:", error);
            await sleep(WORKER_CONFIG.pollIntervalMs);
        }
    }
}

/**
 * pending 상태의 제출 하나를 가져와 judging으로 바꿉니다.
 *
 * PostgreSQL의 FOR UPDATE SKIP LOCKED를 사용해서
 * Worker 여러 개가 동시에 떠 있어도 같은 제출을 중복 채점하지 않게 합니다.
 */
async function claimNextPendingSubmission(): Promise<SubmissionForJudge | null> {
    return prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<SubmissionForJudge[]>`
            SELECT
                "id",
                "problemId",
                "userId",
                "language",
                "code",
                "status",
                "createdAt"
            FROM "Submission"
            WHERE "status" = 'pending'
            ORDER BY "createdAt" ASC
                LIMIT 1
            FOR UPDATE SKIP LOCKED
        `;

        const submission = rows[0];

        if (!submission) {
            return null;
        }

        const updated = await tx.submission.update({
            where: {
                id: submission.id,
            },
            data: {
                status: "judging",
                resultMessage: "채점 중입니다.",
            },
        });

        return updated as unknown as SubmissionForJudge;
    });
}

/** 제출 하나 채점 */
async function judgeSubmission(
    submission: SubmissionForJudge,
): Promise<JudgeResult> {
    const languageConfig = getLanguageConfig(submission.language);

    if (!languageConfig) {
        return {
            status: "runtime",
            resultMessage: `지원하지 않는 언어입니다: ${submission.language}`,
            testPassed: 0,
            testTotal: 0,
        };
    }

    const problem = await getProblem(submission.problemId);

    if (!problem) {
        return {
            status: "runtime",
            resultMessage: "문제를 찾을 수 없습니다.",
            testPassed: 0,
            testTotal: 0,
        };
    }

    const testCases = await getTestCases(submission.problemId);

    if (testCases.length === 0) {
        return {
            status: "runtime",
            resultMessage: "등록된 테스트케이스가 없습니다.",
            testPassed: 0,
            testTotal: 0,
        };
    }

    const timeLimitMs = getTimeLimitMs(problem);
    const memoryLimitMb = getMemoryLimitMb(problem);
    const compareMode = getCompareMode(problem);
    const runtimeTimeoutMs = getRuntimeTimeoutMs(timeLimitMs);

    const workspacePath = await createWorkspace(submission.id);

    try {
        await writeSourceFile(
            workspacePath,
            languageConfig.fileName,
            submission.code ?? "",
        );

        /** 1. 컴파일 */
        if (languageConfig.compileCommand) {
            const compileResult = await runInDocker({
                image: languageConfig.dockerImage,
                workspacePath,
                command: languageConfig.compileCommand,
                timeoutMs: WORKER_CONFIG.compileTimeoutMs,
                memoryLimitMb,
                cpuLimit: WORKER_CONFIG.cpuLimit,
                stdoutLimitBytes: WORKER_CONFIG.stdoutLimitBytes,
                stderrLimitBytes: WORKER_CONFIG.stderrLimitBytes,
            });

            if (compileResult.timeout) {
                return {
                    status: "compile",
                    resultMessage: "컴파일 시간이 초과되었습니다.",
                    memoryKb: null,
                    testPassed: 0,
                    testTotal: testCases.length,
                };
            }

            if (compileResult.outputLimitExceeded) {
                return {
                    status: "compile",
                    resultMessage: "컴파일 출력이 너무 큽니다.",
                    memoryKb: null,
                    testPassed: 0,
                    testTotal: testCases.length,
                };
            }

            if (compileResult.exitCode !== 0) {
                return {
                    status: "compile",
                    resultMessage:
                        cleanRunMessage(compileResult.stderr) ||
                        cleanRunMessage(compileResult.stdout) ||
                        "컴파일 에러가 발생했습니다.",
                    memoryKb: null,
                    testPassed: 0,
                    testTotal: testCases.length,
                };
            }
        }

        /** 2. 테스트케이스 실행 */
        let maxExecutionTimeMs = 0;
        let passedCount = 0;

        const runCommand = createRunCommand({
            language: languageConfig.language,
            fileName: languageConfig.fileName,
            runCommand: languageConfig.runCommand,
        });

        for (let index = 0; index < testCases.length; index++) {
            const testCase = testCases[index];
            const testNumber = index + 1;

            await writeInputFile(
                workspacePath,
                testCase.input ?? "",
                "input.txt",
            );

            const runResult = await runInDocker({
                image: languageConfig.dockerImage,
                workspacePath,
                command: runCommand,
                timeoutMs: runtimeTimeoutMs,
                memoryLimitMb,
                cpuLimit: WORKER_CONFIG.cpuLimit,
                stdoutLimitBytes: WORKER_CONFIG.stdoutLimitBytes,
                stderrLimitBytes: WORKER_CONFIG.stderrLimitBytes,
            });

            maxExecutionTimeMs = Math.max(maxExecutionTimeMs, runResult.durationMs);

            if (runResult.timeout) {
                return {
                    status: "timeout",
                    resultMessage: `시간 초과: ${testNumber}번 테스트케이스`,
                    executionTimeMs: maxExecutionTimeMs,
                    memoryKb: null,
                    testPassed: passedCount,
                    testTotal: testCases.length,
                };
            }

            if (runResult.outputLimitExceeded) {
                return {
                    status: "runtime",
                    resultMessage: `출력 제한 초과: ${testNumber}번 테스트케이스`,
                    executionTimeMs: maxExecutionTimeMs,
                    memoryKb: null,
                    testPassed: passedCount,
                    testTotal: testCases.length,
                };
            }

            if (isMemoryLimitExceeded(runResult)) {
                return {
                    status: "memory",
                    resultMessage: `메모리 초과: ${testNumber}번 테스트케이스`,
                    executionTimeMs: maxExecutionTimeMs,
                    memoryKb: null,
                    testPassed: passedCount,
                    testTotal: testCases.length,
                };
            }

            if (runResult.exitCode !== 0) {
                return {
                    status: "runtime",
                    resultMessage:
                        cleanRunMessage(runResult.stderr) ||
                        cleanRunMessage(runResult.stdout) ||
                        `런타임 에러: ${testNumber}번 테스트케이스`,
                    executionTimeMs: maxExecutionTimeMs,
                    memoryKb: null,
                    testPassed: passedCount,
                    testTotal: testCases.length,
                };
            }

            const userOutput = runResult.stdout;
            const answerOutput = testCase.output ?? "";

            const isCorrect = compareOutput(
                userOutput,
                answerOutput,
                compareMode,
            );

            if (!isCorrect) {
                return {
                    status: "wrong",
                    resultMessage: [
                        `오답: ${testNumber}번 테스트케이스`,
                        createOutputDiffMessage(userOutput, answerOutput),
                    ].join("\n"),
                    executionTimeMs: maxExecutionTimeMs,
                    memoryKb: null,
                    testPassed: passedCount,
                    testTotal: testCases.length,
                };
            }

            passedCount += 1;
        }

        return {
            status: "accepted",
            resultMessage: "정답입니다.",
            executionTimeMs: maxExecutionTimeMs,
            memoryKb: null,
            testPassed: passedCount,
            testTotal: testCases.length,
        };
    } finally {
        await removeWorkspace(workspacePath);
    }
}

/** 문제 조회 */
async function getProblem(problemId: number): Promise<ProblemForJudge | null> {
    const problem = await prisma.problem.findUnique({
        where: {
            id: problemId,
        },
    });

    return problem as unknown as ProblemForJudge | null;
}

/** 테스트케이스 조회 */
async function getTestCases(problemId: number): Promise<TestCaseForJudge[]> {
    const testCases = await prisma.testCase.findMany({
        where: {
            problemId,
        },
        orderBy: {
            id: "asc",
        },
    });

    return testCases as unknown as TestCaseForJudge[];
}

/**
 * 채점 결과 저장 + 문제 정답률 자동 재계산
 *
 * 정답률 기준:
 * accepted / 채점 완료 제출 수 * 100
 *
 * pending, judging은 아직 결과가 없으므로 제외합니다.
 */
async function updateSubmissionResult(
    submission: SubmissionForJudge,
    result: JudgeResult,
): Promise<void> {
    const finalStatus = normalizeFinalStatus(result.status);

    await prisma.$transaction(async (tx) => {
        await tx.submission.update({
            where: {
                id: submission.id,
            },
            data: {
                status: finalStatus,
                resultMessage: result.resultMessage,
                executionTimeMs: result.executionTimeMs ?? null,
                memoryKb: result.memoryKb ?? null,
                testPassed: result.testPassed ?? 0,
                testTotal: result.testTotal ?? 0,
                judgedAt: new Date(),
            },
        });

        const totalJudgedCount = await tx.submission.count({
            where: {
                problemId: submission.problemId,
                status: {
                    notIn: ["pending", "judging"],
                },
            },
        });

        const acceptedCount = await tx.submission.count({
            where: {
                problemId: submission.problemId,
                status: "accepted",
            },
        });

        const solvedRate =
            totalJudgedCount > 0
                ? Math.round((acceptedCount / totalJudgedCount) * 1000) / 10
                : 0;

        await tx.problem.update({
            where: {
                id: submission.problemId,
            },
            data: {
                solvedRate,
            },
        });
    });
}

/** Worker가 중간에 종료되어 judging 상태로 남은 제출 복구 */
async function releaseStaleJudgingSubmissions(): Promise<void> {
    const staleDate = new Date(Date.now() - WORKER_CONFIG.staleJudgingMs);

    const result = await prisma.submission.updateMany({
        where: {
            status: "judging",
            updatedAt: {
                lt: staleDate,
            },
        },
        data: {
            status: "pending",
            resultMessage: "이전 채점이 중단되어 다시 대기열에 등록되었습니다.",
        },
    });

    if (result.count > 0) {
        console.log(`[JudgeWorker] restored stale submissions: ${result.count}`);
    }
}

/** Docker 이미지 사전 다운로드 */
async function preloadDockerImages(): Promise<void> {
    const images = [
        "gcc",
        "python",
        "node",
        "eclipse-temurin",
        "mcr.microsoft.com/dotnet/sdk",
        "dart",
    ];

    for (const image of images) {
        console.log(`[JudgeWorker] pulling image: ${image}`);
        await pullDockerImage(image);
    }
}

/** 문제 시간 제한 */
function getTimeLimitMs(problem: ProblemForJudge): number {
    if (typeof problem.timeLimitMs === "number" && problem.timeLimitMs > 0) {
        return problem.timeLimitMs;
    }

    if (typeof problem.timeLimit === "number" && problem.timeLimit > 0) {
        return problem.timeLimit;
    }

    return WORKER_CONFIG.defaultTimeLimitMs;
}

/** Docker 실행 오버헤드 보정용 타임아웃 */
function getRuntimeTimeoutMs(timeLimitMs: number): number {
    return timeLimitMs + WORKER_CONFIG.runtimeTimeoutBufferMs;
}

/** 문제 메모리 제한 */
function getMemoryLimitMb(problem: ProblemForJudge): number {
    if (
        typeof problem.memoryLimitMb === "number" &&
        problem.memoryLimitMb > 0
    ) {
        return problem.memoryLimitMb;
    }

    if (typeof problem.memoryLimit === "number" && problem.memoryLimit > 0) {
        return problem.memoryLimit;
    }

    return WORKER_CONFIG.defaultMemoryLimitMb;
}

/** 출력 비교 모드 */
function getCompareMode(problem: ProblemForJudge): OutputCompareMode {
    if (
        problem.compareMode === "default" ||
        problem.compareMode === "exact" ||
        problem.compareMode === "token"
    ) {
        return problem.compareMode;
    }

    return "default";
}

/** Worker 내부 상태명을 DB/프론트에서 사용하는 상태명으로 변환 */
function normalizeFinalStatus(status: JudgeInternalStatus): SubmissionDbStatus {
    switch (status) {
        case "timeout":
            return "timeLimit";

        case "memory":
            return "memoryLimit";

        case "pending":
        case "judging":
        case "accepted":
        case "wrong":
        case "compile":
        case "runtime":
            return status;
    }
}

function shellQuote(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function createRunCommand({
                              language,
                              fileName,
                              runCommand,
                          }: {
    language: string;
    fileName: string;
    runCommand: string;
}) {
    const normalized = language.trim().toLowerCase();

    switch (normalized) {
        case "python":
        case "py":
        case "python3":
            /**
             * python:3.12-slim 이미지에는 python3 명령이 있습니다.
             * -u 옵션을 넣어 stdout buffering 문제를 줄입니다.
             */
            return `python3 -u ${shellQuote(fileName)} < input.txt`;

        case "javascript":
        case "js":
        case "node":
        case "nodejs":
            return `node ${shellQuote(fileName)} < input.txt`;

        case "java":
            return "java Main < input.txt";

        case "csharp":
        case "c#":
        case "dotnet":
            return "dotnet ./bin/Release/net8.0/Judge.dll < input.txt";

        case "dart":
            return "./main < input.txt";

        case "c":
        case "cpp":
        case "c++":
        default:
            return `${runCommand} < input.txt`;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shutdown(signal: string): Promise<void> {
    console.log(`[JudgeWorker] ${signal} received. Closing...`);
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(async (error) => {
    console.error("[JudgeWorker] fatal error:", error);
    await prisma.$disconnect();
    process.exit(1);
});