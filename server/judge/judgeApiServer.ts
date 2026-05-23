import http from "http";
import {
    compareOutput,
    createOutputDiffMessage,
    type OutputCompareMode,
} from "./compareOutput";
import { getLanguageConfig } from "./languageConfig";
import {
    cleanupOldWorkspaces,
    createWorkspace,
    removeWorkspace,
    writeInputFile,
    writeSourceFile,
} from "./workspace";
import {
    checkDockerAvailable,
    cleanRunMessage,
    isMemoryLimitExceeded,
    runInDocker,
} from "./judgeRunner";

type JudgeStatus =
    | "accepted"
    | "wrong"
    | "compile"
    | "runtime"
    | "timeLimit"
    | "memoryLimit";

type RunRequest = {
    language?: string;
    sourceFile?: string;
    code?: string;
    tests?: Array<{
        id?: string;
        label?: string;
        input?: string;
        expectedOutput?: string;
    }>;
    timeLimitMs?: number;
    memoryLimitMb?: number;
    compareMode?: string;
};

type CaseResult = {
    id: string;
    label: string;
    status: JudgeStatus;
    timeMs: number;
    memoryKb: number | null;
    message: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
};

const PORT = Number(process.env.JUDGE_API_PORT ?? 4002);
const CPU_LIMIT = "1";
const COMPILE_TIMEOUT_MS = 30_000;
const DEFAULT_TIME_LIMIT_MS = 2_000;
const DEFAULT_MEMORY_LIMIT_MB = 256;
const RUNTIME_TIMEOUT_BUFFER_MS = 1_000;
const OUTPUT_LIMIT_BYTES = 10 * 1024 * 1024;

async function main() {
    const dockerAvailable = await checkDockerAvailable();

    if (!dockerAvailable) {
        console.error("[JudgeApi] Docker is not available.");
        process.exit(1);
    }

    await cleanupOldWorkspaces();

    const server = http.createServer((request, response) => {
        void handleRequest(request, response);
    });

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`[JudgeApi] listening on ${PORT}`);
    });
}

async function handleRequest(
    request: http.IncomingMessage,
    response: http.ServerResponse,
) {
    if (request.method === "GET" && request.url === "/health") {
        writeJson(response, 200, { ok: true });
        return;
    }

    if (request.method !== "POST" || request.url !== "/run") {
        writeJson(response, 404, { ok: false, message: "Not found" });
        return;
    }

    try {
        const body = (await readJson(request)) as RunRequest;
        const result = await runJudge(body);
        writeJson(response, 200, { ok: true, mode: "run", ...result });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to run judge.";

        writeJson(response, 500, {
            ok: false,
            mode: "run",
            status: "runtime",
            message,
            results: [],
        });
    }
}

async function runJudge(body: RunRequest): Promise<{
    status: JudgeStatus;
    message: string;
    results: CaseResult[];
}> {
    const languageConfig = getLanguageConfig(body.language ?? "cpp");

    if (!languageConfig) {
        return {
            status: "runtime",
            message: `Unsupported language: ${body.language}`,
            results: [],
        };
    }

    const workspacePath = await createWorkspace(`run_${Date.now()}`);
    const timeLimitMs = getTimeLimitMs(body.timeLimitMs);
    const memoryLimitMb = getMemoryLimitMb(body.memoryLimitMb);
    const compareMode = getCompareMode(body.compareMode);
    const tests = getTests(body.tests);

    try {
        await writeSourceFile(
            workspacePath,
            languageConfig.fileName,
            body.code ?? "",
        );

        if (body.sourceFile && body.sourceFile !== languageConfig.fileName) {
            await writeSourceFile(
                workspacePath,
                body.sourceFile,
                body.code ?? "",
            );
        }

        if (languageConfig.compileCommand) {
            const compileResult = await runInDocker({
                image: languageConfig.dockerImage,
                workspacePath,
                command: languageConfig.compileCommand,
                timeoutMs: COMPILE_TIMEOUT_MS,
                memoryLimitMb,
                cpuLimit: CPU_LIMIT,
                stdoutLimitBytes: OUTPUT_LIMIT_BYTES,
                stderrLimitBytes: OUTPUT_LIMIT_BYTES,
            });

            if (compileResult.timeout) {
                return {
                    status: "compile",
                    message: "Compile timed out.",
                    results: [
                        createCompileResult("Compile timed out."),
                    ],
                };
            }

            if (compileResult.exitCode !== 0) {
                const message =
                    cleanRunMessage(compileResult.stderr) ||
                    cleanRunMessage(compileResult.stdout) ||
                    "Compile failed.";

                return {
                    status: "compile",
                    message,
                    results: [createCompileResult(message)],
                };
            }
        }

        const results: CaseResult[] = [];
        const runCommand = createRunCommand(
            languageConfig.language,
            languageConfig.fileName,
            languageConfig.runCommand,
        );

        for (let index = 0; index < tests.length; index += 1) {
            const test = tests[index];

            await writeInputFile(workspacePath, test.input, "input.txt");

            const runResult = await runInDocker({
                image: languageConfig.dockerImage,
                workspacePath,
                command: runCommand,
                timeoutMs: timeLimitMs + RUNTIME_TIMEOUT_BUFFER_MS,
                memoryLimitMb,
                cpuLimit: CPU_LIMIT,
                stdoutLimitBytes: OUTPUT_LIMIT_BYTES,
                stderrLimitBytes: OUTPUT_LIMIT_BYTES,
            });

            const baseResult = {
                id: test.id,
                label: test.label,
                timeMs: runResult.durationMs,
                memoryKb: runResult.memoryKb,
                input: test.input,
                expectedOutput: test.expectedOutput,
                actualOutput: runResult.stdout,
            };

            if (runResult.timeout) {
                results.push({
                    ...baseResult,
                    status: "timeLimit",
                    message: "Time limit exceeded.",
                });
                continue;
            }

            if (isMemoryLimitExceeded(runResult)) {
                results.push({
                    ...baseResult,
                    status: "memoryLimit",
                    message: "Memory limit exceeded.",
                });
                continue;
            }

            if (runResult.exitCode !== 0) {
                results.push({
                    ...baseResult,
                    status: "runtime",
                    message:
                        cleanRunMessage(runResult.stderr) ||
                        cleanRunMessage(runResult.stdout) ||
                        "Runtime error.",
                    actualOutput: runResult.stdout || runResult.stderr,
                });
                continue;
            }

            const hasExpectedOutput = test.expectedOutput.trim().length > 0;
            const accepted =
                !hasExpectedOutput ||
                compareOutput(runResult.stdout, test.expectedOutput, compareMode);

            results.push({
                ...baseResult,
                status: accepted ? "accepted" : "wrong",
                message: accepted
                    ? hasExpectedOutput
                        ? "Accepted."
                        : "Run completed."
                    : createOutputDiffMessage(runResult.stdout, test.expectedOutput),
            });
        }

        const status = getOverallStatus(results);

        return {
            status,
            message: getOverallMessage(status),
            results,
        };
    } finally {
        await removeWorkspace(workspacePath);
    }
}

function createCompileResult(message: string): CaseResult {
    return {
        id: "compile",
        label: "Compile",
        status: "compile",
        timeMs: 0,
        memoryKb: null,
        message,
        input: "",
        expectedOutput: "",
        actualOutput: message,
    };
}

function getTests(tests: RunRequest["tests"]) {
    if (Array.isArray(tests) && tests.length > 0) {
        return tests.map((test, index) => ({
            id: String(test.id ?? `case-${index + 1}`),
            label: String(test.label ?? `Test ${index + 1}`),
            input: String(test.input ?? ""),
            expectedOutput: String(test.expectedOutput ?? ""),
        }));
    }

    return [
        {
            id: "empty-1",
            label: "Run",
            input: "",
            expectedOutput: "",
        },
    ];
}

function getTimeLimitMs(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_TIME_LIMIT_MS;
    }

    return Math.min(Math.max(Math.floor(parsed), 500), 15_000);
}

function getMemoryLimitMb(value: unknown): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_MEMORY_LIMIT_MB;
    }

    return Math.min(Math.max(Math.floor(parsed), 64), 2_048);
}

function getCompareMode(value: unknown): OutputCompareMode {
    if (value === "exact" || value === "token" || value === "default") {
        return value;
    }

    return "default";
}

function getOverallStatus(results: CaseResult[]): JudgeStatus {
    if (results.some((result) => result.status === "compile")) return "compile";
    if (results.some((result) => result.status === "runtime")) return "runtime";
    if (results.some((result) => result.status === "timeLimit")) return "timeLimit";
    if (results.some((result) => result.status === "memoryLimit")) return "memoryLimit";
    if (results.some((result) => result.status === "wrong")) return "wrong";

    return "accepted";
}

function getOverallMessage(status: JudgeStatus): string {
    switch (status) {
        case "accepted":
            return "Run completed.";
        case "wrong":
            return "Output differs from expected output.";
        case "compile":
            return "Compile error.";
        case "runtime":
            return "Runtime error.";
        case "timeLimit":
            return "Time limit exceeded.";
        case "memoryLimit":
            return "Memory limit exceeded.";
    }
}

function createRunCommand(
    language: string,
    fileName: string,
    runCommand: string,
): string {
    const normalized = language.trim().toLowerCase();

    switch (normalized) {
        case "python":
            return `python3 -u ${shellQuote(fileName)} < input.txt`;
        case "javascript":
            return `node ${shellQuote(fileName)} < input.txt`;
        case "java":
            return "java Main < input.txt";
        case "csharp":
            return "dotnet ./bin/Release/net8.0/Judge.dll < input.txt";
        case "dart":
            return "./main < input.txt";
        default:
            return `${runCommand} < input.txt`;
    }
}

function shellQuote(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function readJson(request: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let body = "";

        request.setEncoding("utf8");
        request.on("data", (chunk) => {
            body += chunk;
        });
        request.on("end", () => {
            try {
                resolve(JSON.parse(body || "{}"));
            } catch (error) {
                reject(error);
            }
        });
        request.on("error", reject);
    });
}

function writeJson(
    response: http.ServerResponse,
    statusCode: number,
    value: unknown,
): void {
    response.writeHead(statusCode, {
        "content-type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify(value));
}

main().catch((error) => {
    console.error("[JudgeApi] fatal error:", error);
    process.exit(1);
});
