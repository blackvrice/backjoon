// src/server/judge/workspace.ts

import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

const WORKSPACE_ROOT_NAME = "local-boj-judge";

/**
 * 채점 작업 폴더 경로
 *
 * 중요:
 * Next.js 프로젝트 내부에 만들면 dev 서버가 파일 변경을 감지해서
 * 계속 새로고침될 수 있습니다.
 *
 * 그래서 반드시 os.tmpdir() 아래에 만듭니다.
 */
export function getWorkspaceRoot(): string {
    return path.join(os.tmpdir(), WORKSPACE_ROOT_NAME);
}

/** 제출 1개에 대한 독립 작업 폴더 생성 */
export async function createWorkspace(
    submissionId: number | string,
): Promise<string> {
    const root = getWorkspaceRoot();

    await fs.mkdir(root, {
        recursive: true,
    });

    const safeId = sanitizePathName(String(submissionId));
    const random = crypto.randomBytes(6).toString("hex");
    const workspacePath = path.join(root, `${safeId}_${Date.now()}_${random}`);

    await fs.mkdir(workspacePath, {
        recursive: true,
    });

    return workspacePath;
}

/** 작업 폴더 삭제 */
export async function removeWorkspace(workspacePath: string): Promise<void> {
    try {
        await fs.rm(workspacePath, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 100,
        });
    } catch {
        // 삭제 실패는 채점 결과에 영향을 주지 않음
    }
}

/** 소스 코드 파일 작성 */
export async function writeSourceFile(
    workspacePath: string,
    fileName: string,
    code: string,
): Promise<string> {
    return writeTextFile(workspacePath, fileName, code);
}

/** input.txt 작성 */
export async function writeInputFile(
    workspacePath: string,
    input: string,
    fileName = "input.txt",
): Promise<string> {
    return writeTextFile(workspacePath, fileName, input);
}

/**
 * output.txt 작성
 *
 * 보통은 필요 없지만, 디버깅이나 파일 기반 채점에 사용할 수 있습니다.
 */
export async function writeExpectedOutputFile(
    workspacePath: string,
    output: string,
    fileName = "answer.txt",
): Promise<string> {
    return writeTextFile(workspacePath, fileName, output);
}

/** 일반 텍스트 파일 작성 */
export async function writeTextFile(
    workspacePath: string,
    fileName: string,
    content: string,
): Promise<string> {
    await fs.mkdir(workspacePath, {
        recursive: true,
    });

    const filePath = resolveInsideWorkspace(workspacePath, fileName);

    await fs.writeFile(filePath, String(content ?? ""), "utf-8");

    return filePath;
}

/** 작업 폴더 안의 파일 읽기 */
export async function readTextFile(
    workspacePath: string,
    fileName: string,
): Promise<string> {
    const filePath = resolveInsideWorkspace(workspacePath, fileName);

    return fs.readFile(filePath, "utf-8");
}

/**
 * 작업 폴더 내부 경로 안전하게 만들기
 *
 * ../../../ 같은 경로 탈출 방지용입니다.
 */
export function resolveInsideWorkspace(
    workspacePath: string,
    targetPath: string,
): string {
    if (path.isAbsolute(targetPath)) {
        throw new Error(`Invalid workspace path: ${targetPath}`);
    }

    const workspaceResolved = path.resolve(workspacePath);
    const targetResolved = path.resolve(workspaceResolved, targetPath);

    const workspaceCheck = normalizeForCompare(workspaceResolved);
    const targetCheck = normalizeForCompare(targetResolved);

    if (
        targetCheck !== workspaceCheck &&
        !targetCheck.startsWith(workspaceCheck + path.sep)
    ) {
        throw new Error(`Invalid workspace path: ${targetPath}`);
    }

    return targetResolved;
}

/**
 * 오래된 작업 폴더 청소
 *
 * Worker 시작할 때 한 번 호출해도 됩니다.
 */
export async function cleanupOldWorkspaces(
    maxAgeMs = 1000 * 60 * 60 * 6,
): Promise<void> {
    const root = getWorkspaceRoot();

    try {
        const entries = await fs.readdir(root, {
            withFileTypes: true,
        });

        const now = Date.now();

        await Promise.all(
            entries
                .filter((entry) => entry.isDirectory())
                .map(async (entry) => {
                    const target = path.join(root, entry.name);

                    try {
                        const stat = await fs.stat(target);

                        if (now - stat.mtimeMs > maxAgeMs) {
                            await fs.rm(target, {
                                recursive: true,
                                force: true,
                                maxRetries: 3,
                                retryDelay: 100,
                            });
                        }
                    } catch {
                        // 개별 폴더 삭제 실패는 무시
                    }
                }),
        );
    } catch {
        // root가 아직 없을 수 있음
    }
}

function sanitizePathName(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function normalizeForCompare(value: string): string {
    const resolved = path.resolve(value);

    if (process.platform === "win32") {
        return resolved.toLowerCase();
    }

    return resolved;
}
