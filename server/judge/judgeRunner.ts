// src/server/judge/judgeRunner.ts

import { spawn } from "child_process";
import crypto from "crypto";
import path from "path";

export interface DockerRunOptions {
    image: string;
    workspacePath: string;
    command: string;
    timeoutMs: number;
    memoryLimitMb: number;

    /** 기본값: 1 */
    cpuLimit?: string;

    /** 기본값: 10MB */
    stdoutLimitBytes?: number;

    /** 기본값: 10MB */
    stderrLimitBytes?: number;
}

export interface DockerRunResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timeout: boolean;
    outputLimitExceeded: boolean;
    durationMs: number;

    /**
     * 현재 구현에서는 Docker stats 기반 메모리 측정을 하지 않으므로 null입니다.
     * judgeWorker.ts에서 타입 오류 없이 사용할 수 있도록 필드는 유지합니다.
     */
    memoryKb: number | null;
}

const DEFAULT_CPU_LIMIT = "1";
const DEFAULT_STDOUT_LIMIT_BYTES = 10 * 1024 * 1024;
const DEFAULT_STDERR_LIMIT_BYTES = 10 * 1024 * 1024;

/**
 * Docker 컨테이너 안에서 명령 실행
 *
 * 핵심 보안 옵션:
 * - --network none
 * - --memory / --memory-swap
 * - --cpus
 * - --pids-limit
 * - --security-opt no-new-privileges
 */
export function runInDocker(
    options: DockerRunOptions,
): Promise<DockerRunResult> {
    return new Promise((resolve) => {
        const startedAt = Date.now();
        const containerName = createContainerName();

        const stdoutLimitBytes =
            options.stdoutLimitBytes ?? DEFAULT_STDOUT_LIMIT_BYTES;
        const stderrLimitBytes =
            options.stderrLimitBytes ?? DEFAULT_STDERR_LIMIT_BYTES;

        const workspacePath = toDockerVolumePath(options.workspacePath);

        const dockerArgs = [
            "run",
            "--rm",
            "--name",
            containerName,

            "--network",
            "none",

            "--cpus",
            options.cpuLimit ?? DEFAULT_CPU_LIMIT,

            "--memory",
            `${options.memoryLimitMb}m`,
            "--memory-swap",
            `${options.memoryLimitMb}m`,

            "--pids-limit",
            "128",

            "--security-opt",
            "no-new-privileges",

            "--init",

            "-v",
            `${workspacePath}:/app`,

            "-w",
            "/app",

            options.image,

            "sh",
            "-lc",
            options.command,
        ];

        let stdout = "";
        let stderr = "";
        let stdoutBytes = 0;
        let stderrBytes = 0;

        let timeout = false;
        let outputLimitExceeded = false;
        let resolved = false;

        const child = spawn("docker", dockerArgs, {
            windowsHide: true,
            env: {
                ...process.env,
                DOCKER_CLI_HINTS: "false",
            },
        });

        const finish = (
            result: Omit<DockerRunResult, "durationMs" | "memoryKb"> & {
                memoryKb?: number | null;
            },
        ) => {
            if (resolved) return;

            resolved = true;
            clearTimeout(timer);

            resolve({
                ...result,
                durationMs: Date.now() - startedAt,
                memoryKb: result.memoryKb ?? null,
            });
        };

        const stopContainer = () => {
            killDockerProcess(child.pid);
            removeContainer(containerName);
        };

        const timer = setTimeout(() => {
            timeout = true;
            stopContainer();
        }, options.timeoutMs);

        child.stdout.on("data", (data: Buffer) => {
            stdoutBytes += data.length;

            if (stdoutBytes > stdoutLimitBytes) {
                outputLimitExceeded = true;
                stopContainer();
                return;
            }

            stdout += data.toString("utf8");
        });

        child.stderr.on("data", (data: Buffer) => {
            stderrBytes += data.length;

            if (stderrBytes > stderrLimitBytes) {
                outputLimitExceeded = true;
                stopContainer();
                return;
            }

            stderr += data.toString("utf8");
        });

        child.on("error", (error) => {
            finish({
                stdout,
                stderr: String(error),
                exitCode: 1,
                signal: null,
                timeout,
                outputLimitExceeded,
                memoryKb: null,
            });
        });

        child.on("close", (exitCode, signal) => {
            finish({
                stdout,
                stderr,
                exitCode,
                signal,
                timeout,
                outputLimitExceeded,
                memoryKb: null,
            });
        });
    });
}

/** Docker 설치 확인 */
export function checkDockerAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        const child = spawn("docker", ["--version"], {
            windowsHide: true,
            env: {
                ...process.env,
                DOCKER_CLI_HINTS: "false",
            },
        });

        child.on("error", () => {
            resolve(false);
        });

        child.on("close", (code) => {
            resolve(code === 0);
        });
    });
}

/**
 * Docker 이미지 pull
 *
 * Worker 시작 전에 미리 실행하면 첫 채점 지연을 줄일 수 있습니다.
 */
export function pullDockerImage(image: string): Promise<boolean> {
    return new Promise((resolve) => {
        const child = spawn("docker", ["pull", image], {
            windowsHide: true,
            stdio: "ignore",
            env: {
                ...process.env,
                DOCKER_CLI_HINTS: "false",
            },
        });

        child.on("error", () => {
            resolve(false);
        });

        child.on("close", (code) => {
            resolve(code === 0);
        });
    });
}

/** 메모리 초과로 볼 수 있는지 확인 */
export function isMemoryLimitExceeded(result: DockerRunResult): boolean {
    const stderr = result.stderr.toLowerCase();

    return (
        result.exitCode === 137 ||
        stderr.includes("out of memory") ||
        stderr.includes("cannot allocate memory") ||
        stderr.includes("memoryerror") ||
        stderr.includes("killed")
    );
}

/** 런타임/컴파일 에러 메시지 정리 */
export function cleanRunMessage(message: string, maxLength = 4000): string {
    const trimmed = String(message ?? "").trim();

    if (!trimmed) {
        return "";
    }

    if (trimmed.length > maxLength) {
        return `${trimmed.slice(0, maxLength)}\n...`;
    }

    return trimmed;
}

function createContainerName(): string {
    return `judge_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * Docker Desktop on Windows에서는 volume source path가
 * C:\web\backjoon\... 형태일 때보다 C:/web/backjoon/... 형태가 안정적입니다.
 */
function toDockerVolumePath(workspacePath: string): string {
    const resolvedPath = path.resolve(workspacePath);

    if (process.platform === "win32") {
        return resolvedPath.replace(/\\/g, "/");
    }

    return resolvedPath;
}

function killDockerProcess(pid: number | undefined): void {
    if (!pid) return;

    try {
        process.kill(pid, "SIGKILL");
    } catch {
        // 이미 종료된 경우 무시
    }
}

function removeContainer(containerName: string): void {
    try {
        spawn("docker", ["rm", "-f", containerName], {
            windowsHide: true,
            stdio: "ignore",
            env: {
                ...process.env,
                DOCKER_CLI_HINTS: "false",
            },
        });
    } catch {
        // 컨테이너 제거 실패는 이후 Docker --rm 또는 수동 정리로 처리
    }
}