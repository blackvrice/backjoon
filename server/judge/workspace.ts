import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

export type JudgeLanguage =
  | "cpp"
  | "python"
  | "javascript"
  | "java"
  | "dart"
  | "csharp";

const WORKSPACE_ROOT_NAME = "backjoon-judge";

const fileNameByLanguage: Record<JudgeLanguage, string> = {
  cpp: "Main.cpp",
  python: "main.py",
  javascript: "main.js",
  java: "Main.java",
  dart: "main.dart",
  csharp: "Program.cs",
};

export function getWorkspaceRoot(): string {
  return path.join(os.tmpdir(), WORKSPACE_ROOT_NAME);
}

export async function createWorkspace(submissionId: number | string): Promise<string>;
export async function createWorkspace(
  submissionId: number | string,
  language: JudgeLanguage,
  sourceCode: string,
): Promise<{
  workspaceDir: string;
  sourcePath: string;
  fileName: string;
}>;
export async function createWorkspace(
  submissionId: number | string,
  language?: JudgeLanguage,
  sourceCode?: string,
) {
  const rootDir = getWorkspaceRoot();
  const safeId = sanitizePathName(String(submissionId));
  const workspaceDir =
    language === undefined
      ? path.join(rootDir, `${safeId}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`)
      : path.join(rootDir, `submission-${safeId}`);

  await fs.rm(workspaceDir, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(workspaceDir, {
    recursive: true,
  });

  if (language === undefined) {
    return workspaceDir;
  }

  const fileName = fileNameByLanguage[language];

  if (!fileName) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const sourcePath = path.join(workspaceDir, fileName);

  await fs.writeFile(sourcePath, sourceCode ?? "", "utf8");

  return {
    workspaceDir,
    sourcePath,
    fileName,
  };
}

export async function removeWorkspace(workspacePath: string): Promise<void> {
  try {
    await fs.rm(workspacePath, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  } catch {
    // Cleanup failure should not change the judge result.
  }
}

export async function writeSourceFile(
  workspacePath: string,
  fileName: string,
  code: string,
): Promise<string> {
  return writeTextFile(workspacePath, fileName, code);
}

export async function writeInputFile(
  workspacePath: string,
  input: string,
  fileName = "input.txt",
): Promise<string> {
  return writeTextFile(workspacePath, fileName, input);
}

export async function writeExpectedOutputFile(
  workspacePath: string,
  output: string,
  fileName = "answer.txt",
): Promise<string> {
  return writeTextFile(workspacePath, fileName, output);
}

export async function writeTextFile(
  workspacePath: string,
  fileName: string,
  content: string,
): Promise<string> {
  await fs.mkdir(workspacePath, {
    recursive: true,
  });

  const filePath = resolveInsideWorkspace(workspacePath, fileName);
  await fs.writeFile(filePath, String(content ?? ""), "utf8");

  return filePath;
}

export async function readTextFile(
  workspacePath: string,
  fileName: string,
): Promise<string> {
  const filePath = resolveInsideWorkspace(workspacePath, fileName);

  return fs.readFile(filePath, "utf8");
}

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
              await removeWorkspace(target);
            }
          } catch {
            // Ignore individual cleanup failures.
          }
        }),
    );
  } catch {
    // The workspace root may not exist yet.
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
