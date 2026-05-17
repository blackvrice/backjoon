// lsp-server/server.ts

import "dotenv/config";
import http from "http";
import {
    spawn,
    type ChildProcessWithoutNullStreams,
    type SpawnOptionsWithoutStdio
} from "child_process";
import {
    WebSocketServer,
    WebSocket,
    type RawData
} from "ws";
import path from "path";
import fs from "fs";

type LspLanguage =
    | "cpp"
    | "java"
    | "python"
    | "javascript"
    | "dart"
    | "csharp";

function findFirstExistingPath(paths: Array<string | undefined | null>): string | null {
    for (const item of paths) {
        if (!item) continue;

        if (fs.existsSync(item)) {
            return item;
        }
    }

    return null;
}

function toPosixPath(filePath: string): string {
    return filePath.replace(/\\/g, "/");
}

function isWindows() {
    return process.platform === "win32";
}

function localBinCommand(commandName: string) {
    return path.join(
        process.cwd(),
        "node_modules",
        ".bin",
        isWindows() ? `${commandName}.cmd` : commandName
    );
}

function isClangCompiler(compilerPath: string) {
    const fileName = path.basename(compilerPath).toLowerCase();

    return (
        fileName === "clang++.exe" ||
        fileName === "clang++" ||
        fileName === "clang.exe" ||
        fileName === "clang"
    );
}

const PORT = Number(process.env.LSP_PORT ?? 4001);
const WORKSPACE_ROOT = path.resolve(process.cwd(), ".lsp-workspace");

const DEFAULT_JAVA_HOME = "C:\\Program Files\\Java\\jdk-26.0.1";
const JAVA_HOME = process.env.JAVA_HOME || DEFAULT_JAVA_HOME;

const JAVA_COMMAND =
    process.env.JAVA_PATH ||
    path.join(JAVA_HOME, "bin", isWindows() ? "java.exe" : "java");

const JDTLS_HOME =
    process.env.JDTLS_HOME ||
    "C:\\tools\\jdtls";

const CLANGD_COMMAND =
    process.env.CLANGD_PATH ||
    findFirstExistingPath([
        "C:/Program Files/LLVM/bin/clangd.exe",
        "C:/msys64/clang64/bin/clangd.exe",
        "C:/msys64/ucrt64/bin/clangd.exe",
        "C:/msys64/mingw64/bin/clangd.exe"
    ]) ||
    "clangd";

const PYRIGHT_COMMAND =
    process.env.PYRIGHT_LANGSERVER_PATH ||
    findFirstExistingPath([
        localBinCommand("pyright-langserver"),
        "C:/Program Files/nodejs/pyright-langserver.cmd"
    ]) ||
    "pyright-langserver";

const TYPESCRIPT_LANGUAGE_SERVER_COMMAND =
    process.env.TYPESCRIPT_LANGUAGE_SERVER_PATH ||
    findFirstExistingPath([
        localBinCommand("typescript-language-server"),
        "C:/Program Files/nodejs/typescript-language-server.cmd"
    ]) ||
    "typescript-language-server";

const DART_COMMAND =
    process.env.DART_PATH ||
    "dart";

const CSHARP_LS_COMMAND =
    process.env.CSHARP_LS_PATH ||
    "csharp-ls";

fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });

const server = http.createServer();

const wss = new WebSocketServer({
    server,
    path: "/lsp"
});

function normalizeLanguage(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getLanguageFromUrl(url?: string): LspLanguage | null {
    if (!url) return null;

    const parsed = new URL(url, `http://localhost:${PORT}`);
    const language = parsed.searchParams.get("language");

    if (!language) return null;

    const normalized = normalizeLanguage(language);

    if (
        normalized === "cpp" ||
        normalized === "c++" ||
        normalized === "c++17" ||
        normalized === "cpp17"
    ) {
        return "cpp";
    }

    if (
        normalized === "java" ||
        normalized === "java17" ||
        normalized === "java21" ||
        normalized === "java26"
    ) {
        return "java";
    }

    if (
        normalized === "python" ||
        normalized === "python3" ||
        normalized === "python3.12" ||
        normalized === "py"
    ) {
        return "python";
    }

    if (
        normalized === "javascript" ||
        normalized === "js" ||
        normalized === "node" ||
        normalized === "nodejs"
    ) {
        return "javascript";
    }

    if (normalized === "dart") {
        return "dart";
    }

    if (
        normalized === "csharp" ||
        normalized === "cs" ||
        normalized === "c#" ||
        normalized === "c#12" ||
        normalized === "csharp12"
    ) {
        return "csharp";
    }

    return null;
}

function getLanguageWorkspace(language: LspLanguage): string {
    const workspace = path.join(WORKSPACE_ROOT, language);
    fs.mkdirSync(workspace, { recursive: true });
    return workspace;
}

function ensureFile(filePath: string, content: string) {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, "utf8");
    }
}

function writeFile(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
}

function shouldUseShell(command: string) {
    if (process.platform !== "win32") {
        return false;
    }

    const ext = path.extname(command).toLowerCase();

    if (ext === ".exe") {
        return false;
    }

    if (ext === ".cmd" || ext === ".bat") {
        return true;
    }

    if (!command.includes("\\") && !command.includes("/")) {
        return true;
    }

    return false;
}

function spawnLanguageServer(
    command: string,
    args: string[],
    cwd: string,
    options?: Partial<SpawnOptionsWithoutStdio>
): ChildProcessWithoutNullStreams {
    return spawn(command, args, {
        cwd,
        stdio: "pipe",
        shell: options?.shell ?? shouldUseShell(command),
        env: {
            ...process.env,
            PATH: process.env.PATH ?? process.env.Path ?? "",
            Path: process.env.Path ?? process.env.PATH ?? "",
            ...(options?.env ?? {})
        }
    });
}

/**
 * MSYS2 g++.exe 실행에 필요한 bin 경로를 PATH 앞에 붙입니다.
 */
function getPathEnvWithPrependedDir(dir: string): NodeJS.ProcessEnv {
    const currentPath = process.env.Path ?? process.env.PATH ?? "";
    const mergedPath = `${dir}${path.delimiter}${currentPath}`;

    return {
        ...process.env,
        PATH: mergedPath,
        Path: mergedPath
    };
}

function getCppCompilerCandidates(): string[] {
    const candidates = [
        process.env.CPP_COMPILER_PATH,
        process.env.CXX,

        "C:/msys64/ucrt64/bin/g++.exe",
        "C:/msys64/mingw64/bin/g++.exe",

        "C:/msys64/clang64/bin/clang++.exe"
    ];

    return candidates.filter((item): item is string => Boolean(item));
}

function getCppCompilerPath(): string {
    const compilerPath = findFirstExistingPath(getCppCompilerCandidates());

    if (!compilerPath) {
        throw new Error(
            [
                "C++ compiler not found.",
                "",
                "Install MSYS2 UCRT64 GCC or set CPP_COMPILER_PATH in .env.",
                "",
                "Recommended:",
                "CPP_COMPILER_PATH=C:/msys64/ucrt64/bin/g++.exe",
                "CLANGD_QUERY_DRIVER=C:/msys64/ucrt64/bin/g++.exe",
                "",
                "Alternative if you only installed clang64:",
                "CPP_COMPILER_PATH=C:/msys64/clang64/bin/clang++.exe",
                "CLANGD_QUERY_DRIVER=C:/msys64/clang64/bin/clang++.exe"
            ].join("\n")
        );
    }

    return compilerPath;
}

function getCppCompilerBinDir(): string {
    return path.dirname(getCppCompilerPath());
}

function getClangdQueryDriver(): string {
    if (process.env.CLANGD_QUERY_DRIVER) {
        return process.env.CLANGD_QUERY_DRIVER;
    }

    return getCppCompilerPath();
}

function getMsysRootFromCompilerPath(compilerPath: string): string | null {
    const normalized = toPosixPath(compilerPath).toLowerCase();

    if (normalized.includes("/ucrt64/")) {
        return "C:/msys64/ucrt64";
    }

    if (normalized.includes("/mingw64/")) {
        return "C:/msys64/mingw64";
    }

    if (normalized.includes("/clang64/")) {
        return "C:/msys64/clang64";
    }

    return null;
}

function getCppTarget(compilerPath: string): string {
    const normalized = toPosixPath(compilerPath).toLowerCase();

    if (
        normalized.includes("/ucrt64/") ||
        normalized.includes("/mingw64/") ||
        normalized.includes("/clang64/")
    ) {
        return "x86_64-w64-windows-gnu";
    }

    return "x86_64-w64-windows-gnu";
}

function getCppTargetFlags(compilerPath: string): string[] {
    if (!isClangCompiler(compilerPath)) {
        return [];
    }

    return [`--target=${getCppTarget(compilerPath)}`];
}

function findCppStdlibIncludeDirs(compilerPath: string): string[] {
    const root = getMsysRootFromCompilerPath(compilerPath);

    if (!root) {
        return [];
    }

    const includeDirs: string[] = [];
    const cppIncludeRoot = `${root}/include/c++`;

    if (fs.existsSync(cppIncludeRoot)) {
        const versions = fs
            .readdirSync(cppIncludeRoot)
            .filter((name) => {
                const fullPath = path.join(cppIncludeRoot, name);
                return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
            })
            .sort()
            .reverse();

        const version = versions[0];

        if (version) {
            const versionRoot = `${cppIncludeRoot}/${version}`;
            const targetRoot = `${versionRoot}/x86_64-w64-mingw32`;

            includeDirs.push(versionRoot);

            if (fs.existsSync(targetRoot)) {
                includeDirs.push(targetRoot);
            }
        }
    }

    const commonInclude = `${root}/include`;

    if (fs.existsSync(commonInclude)) {
        includeDirs.push(commonInclude);
    }

    return includeDirs;
}

function findJdtlsLauncherJar(jdtlsHome: string): string {
    const pluginsDir = path.join(jdtlsHome, "plugins");

    if (!fs.existsSync(pluginsDir)) {
        throw new Error(`jdtls plugins directory not found: ${pluginsDir}`);
    }

    const launcherJar = fs
        .readdirSync(pluginsDir)
        .find((file) =>
            file.startsWith("org.eclipse.equinox.launcher_") &&
            file.endsWith(".jar")
        );

    if (!launcherJar) {
        throw new Error(`jdtls launcher jar not found in: ${pluginsDir}`);
    }

    return path.join(pluginsDir, launcherJar);
}

function getJdtlsConfigDir(): string {
    if (process.env.JDTLS_CONFIG) {
        return process.env.JDTLS_CONFIG;
    }

    if (process.platform === "win32") {
        return path.join(JDTLS_HOME, "config_win");
    }

    if (process.platform === "darwin") {
        return path.join(JDTLS_HOME, "config_mac");
    }

    return path.join(JDTLS_HOME, "config_linux");
}

function validateJavaRuntime() {
    if (!fs.existsSync(JAVA_COMMAND) && JAVA_COMMAND !== "java") {
        throw new Error(
            [
                "Java runtime not found.",
                "",
                `JAVA_COMMAND=${JAVA_COMMAND}`,
                "",
                "Set JAVA_HOME or JAVA_PATH in .env.",
                "",
                "Example:",
                "JAVA_HOME=C:/Program Files/Java/jdk-26.0.1"
            ].join("\n")
        );
    }
}

function ensureCppWorkspaceFiles() {
    const workspace = getLanguageWorkspace("cpp");

    const mainCppPath = path.join(workspace, "Main.cpp");
    const objectPath = path.join(workspace, "Main.o");

    const cppCompilerPath = getCppCompilerPath();
    const cppTargetFlags = getCppTargetFlags(cppCompilerPath);
    const cppIncludeDirs = findCppStdlibIncludeDirs(cppCompilerPath);

    writeFile(
        path.join(WORKSPACE_ROOT, ".clangd"),
        [
            "If:",
            "  PathMatch: .*\\.(cpp|cc|cxx|hpp|h)$",
            "",
            "CompileFlags:",
            "  Add:",
            "    - -xc++",
            "    - -std=c++17",
            "",
            "Completion:",
            "  AllScopes: Yes",
            "",
            "Index:",
            "  Background: Build",
            ""
        ].join("\n")
    );

    writeFile(
        path.join(workspace, ".clangd"),
        [
            "If:",
            "  PathMatch: .*\\.(cpp|cc|cxx|hpp|h)$",
            "",
            "CompileFlags:",
            "  Add:",
            "    - -xc++",
            "    - -std=c++17",
            "    - -Wall",
            "    - -Wextra",
            "    - -O2",
            "    - -I.",
            ...cppTargetFlags.map((flag) => `    - ${flag}`),
            ...cppIncludeDirs.flatMap((dir) => [
                "    - -isystem",
                `    - ${toPosixPath(dir)}`
            ]),
            "",
            "Diagnostics:",
            "  ClangTidy:",
            "    Add:",
            "      - bugprone-*",
            "      - performance-*",
            "      - readability-*",
            "    Remove:",
            "      - readability-magic-numbers",
            "",
            "Completion:",
            "  AllScopes: Yes",
            "",
            "Index:",
            "  Background: Build",
            ""
        ].join("\n")
    );

    writeFile(
        path.join(workspace, "compile_flags.txt"),
        [
            "-xc++",
            "-std=c++17",
            "-Wall",
            "-Wextra",
            "-O2",
            "-I.",
            ...cppTargetFlags,
            ...cppIncludeDirs.flatMap((dir) => [
                "-isystem",
                toPosixPath(dir)
            ])
        ].join("\n")
    );

    writeFile(
        path.join(workspace, "compile_commands.json"),
        JSON.stringify(
            [
                {
                    directory: toPosixPath(workspace),
                    file: toPosixPath(mainCppPath),
                    arguments: [
                        toPosixPath(cppCompilerPath),
                        "-xc++",
                        "-std=c++17",
                        "-Wall",
                        "-Wextra",
                        "-O2",
                        ...cppTargetFlags,
                        "-I",
                        toPosixPath(workspace),
                        ...cppIncludeDirs.flatMap((dir) => [
                            "-isystem",
                            toPosixPath(dir)
                        ]),
                        "-c",
                        toPosixPath(mainCppPath),
                        "-o",
                        toPosixPath(objectPath)
                    ]
                }
            ],
            null,
            2
        )
    );

    ensureFile(
        mainCppPath,
        [
            "#include <bits/stdc++.h>",
            "using namespace std;",
            "",
            "int main() {",
            "    ios::sync_with_stdio(false);",
            "    cin.tie(nullptr);",
            "",
            "    return 0;",
            "}",
            ""
        ].join("\n")
    );
}

function ensurePythonWorkspaceFiles() {
    const workspace = getLanguageWorkspace("python");

    writeFile(
        path.join(workspace, "pyrightconfig.json"),
        JSON.stringify(
            {
                typeCheckingMode: "basic",
                pythonVersion: "3.12",
                reportMissingImports: "warning",
                reportMissingTypeStubs: false,
                useLibraryCodeForTypes: true,
                autoSearchPaths: true,
                extraPaths: ["."]
            },
            null,
            2
        )
    );

    ensureFile(
        path.join(workspace, "Main.py"),
        [
            "import sys",
            "",
            "def main():",
            "    pass",
            "",
            "if __name__ == '__main__':",
            "    main()",
            ""
        ].join("\n")
    );
}

function ensureJavascriptWorkspaceFiles() {
    const workspace = getLanguageWorkspace("javascript");

    ensureFile(
        path.join(workspace, "package.json"),
        JSON.stringify(
            {
                type: "commonjs",
                private: true
            },
            null,
            2
        )
    );

    ensureFile(
        path.join(workspace, "jsconfig.json"),
        JSON.stringify(
            {
                compilerOptions: {
                    target: "ES2022",
                    module: "CommonJS",
                    checkJs: true,
                    allowJs: true,
                    noEmit: true,
                    strict: false
                },
                include: ["**/*.js"]
            },
            null,
            2
        )
    );

    ensureFile(
        path.join(workspace, "Main.js"),
        [
            "const fs = require('fs');",
            "const input = fs.readFileSync(0, 'utf8').trim();",
            "",
            "function main() {",
            "  console.log(input);",
            "}",
            "",
            "main();",
            ""
        ].join("\n")
    );
}

function ensureDartWorkspaceFiles() {
    const workspace = getLanguageWorkspace("dart");

    ensureFile(
        path.join(workspace, "pubspec.yaml"),
        [
            "name: judge_workspace",
            "description: Local judge Dart workspace",
            "version: 1.0.0",
            "environment:",
            "  sdk: '>=3.0.0 <4.0.0'",
            ""
        ].join("\n")
    );

    ensureFile(
        path.join(workspace, "analysis_options.yaml"),
        [
            "analyzer:",
            "  language:",
            "    strict-casts: false",
            "    strict-inference: false",
            "    strict-raw-types: false",
            "linter:",
            "  rules:",
            "    prefer_final_locals: false",
            ""
        ].join("\n")
    );

    ensureFile(
        path.join(workspace, "Main.dart"),
        [
            "import 'dart:io';",
            "",
            "void main() {",
            "  final input = stdin.readAsStringSync();",
            "  print(input);",
            "}",
            ""
        ].join("\n")
    );
}

function ensureCsharpWorkspaceFiles() {
    const workspace = getLanguageWorkspace("csharp");

    ensureFile(
        path.join(workspace, "JudgeWorkspace.csproj"),
        [
            "<Project Sdk=\"Microsoft.NET.Sdk\">",
            "  <PropertyGroup>",
            "    <OutputType>Exe</OutputType>",
            "    <TargetFramework>net10.0</TargetFramework>",
            "    <ImplicitUsings>enable</ImplicitUsings>",
            "    <Nullable>enable</Nullable>",
            "  </PropertyGroup>",
            "</Project>",
            ""
        ].join("\n")
    );

    ensureFile(
        path.join(workspace, "Main.cs"),
        [
            "using System;",
            "using System.IO;",
            "using System.Linq;",
            "using System.Collections.Generic;",
            "",
            "public class Program",
            "{",
            "    public static void Main()",
            "    {",
            "        var input = Console.In.ReadToEnd();",
            "        Console.WriteLine(input);",
            "    }",
            "}",
            ""
        ].join("\n")
    );
}

function ensureJavaWorkspaceFiles() {
    const workspace = getLanguageWorkspace("java");

    ensureFile(
        path.join(workspace, "src", "Main.java"),
        [
            "import java.io.*;",
            "import java.util.*;",
            "",
            "public class Main {",
            "    public static void main(String[] args) throws Exception {",
            "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
            "        StringBuilder sb = new StringBuilder();",
            "        System.out.print(sb.toString());",
            "    }",
            "}",
            ""
        ].join("\n")
    );
}
function createCppLanguageServer(): ChildProcessWithoutNullStreams {
    ensureCppWorkspaceFiles();

    const workspace = getLanguageWorkspace("cpp");
    const queryDriver = getClangdQueryDriver();
    const cppCompilerBinDir = getCppCompilerBinDir();

    return spawnLanguageServer(
        CLANGD_COMMAND,
        [
            "--log=error",
            "--background-index",
            "--clang-tidy",
            "--all-scopes-completion",
            "--completion-style=detailed",
            "--function-arg-placeholders=true",
            "--header-insertion=iwyu",
            "--pch-storage=memory",
            `--compile-commands-dir=${workspace}`,
            `--query-driver=${queryDriver}`
        ],
        workspace,
        {
            env: getPathEnvWithPrependedDir(cppCompilerBinDir)
        }
    );
}

function createPythonLanguageServer(): ChildProcessWithoutNullStreams {
    ensurePythonWorkspaceFiles();

    const workspace = getLanguageWorkspace("python");

    return spawnLanguageServer(
        PYRIGHT_COMMAND,
        ["--stdio"],
        workspace
    );
}

function createJavascriptLanguageServer(): ChildProcessWithoutNullStreams {
    ensureJavascriptWorkspaceFiles();

    const workspace = getLanguageWorkspace("javascript");

    return spawnLanguageServer(
        TYPESCRIPT_LANGUAGE_SERVER_COMMAND,
        ["--stdio"],
        workspace
    );
}

function createDartLanguageServer(): ChildProcessWithoutNullStreams {
    ensureDartWorkspaceFiles();

    const workspace = getLanguageWorkspace("dart");

    return spawnLanguageServer(
        DART_COMMAND,
        [
            "language-server",
            "--protocol=lsp"
        ],
        workspace
    );
}

function createCsharpLanguageServer(): ChildProcessWithoutNullStreams {
    ensureCsharpWorkspaceFiles();

    const workspace = getLanguageWorkspace("csharp");

    return spawnLanguageServer(
        CSHARP_LS_COMMAND,
        [],
        workspace
    );
}

function createJavaLanguageServer(): ChildProcessWithoutNullStreams {
    ensureJavaWorkspaceFiles();
    validateJavaRuntime();

    const workspace = getLanguageWorkspace("java");
    const launcherJar = findJdtlsLauncherJar(JDTLS_HOME);
    const configDir = getJdtlsConfigDir();

    if (!fs.existsSync(configDir)) {
        throw new Error(`jdtls config directory not found: ${configDir}`);
    }

    const javaWorkspace = path.join(
        workspace,
        "jdtls-data",
        `${Date.now()}-${Math.random().toString(16).slice(2)}`
    );

    fs.mkdirSync(javaWorkspace, { recursive: true });

    return spawnLanguageServer(
        JAVA_COMMAND,
        [
            "-Declipse.application=org.eclipse.jdt.ls.core.id1",
            "-Dosgi.bundles.defaultStartLevel=4",
            "-Declipse.product=org.eclipse.jdt.ls.core.product",

            "-Xmx1G",

            "--enable-final-field-mutation=ALL-UNNAMED",
            "--illegal-final-field-mutation=allow",

            "--add-modules=ALL-SYSTEM",
            "--add-opens",
            "java.base/java.util=ALL-UNNAMED",
            "--add-opens",
            "java.base/java.lang=ALL-UNNAMED",

            "-jar",
            launcherJar,

            "-configuration",
            configDir,

            "-data",
            javaWorkspace
        ],
        workspace,
        {
            env: {
                ...process.env,
                JDK_JAVA_OPTIONS:
                    process.env.JDK_JAVA_OPTIONS ||
                    "--enable-final-field-mutation=ALL-UNNAMED --illegal-final-field-mutation=allow"
            }
        }
    );
}

function createLanguageServer(language: LspLanguage): ChildProcessWithoutNullStreams {
    switch (language) {
        case "cpp":
            return createCppLanguageServer();

        case "java":
            return createJavaLanguageServer();

        case "python":
            return createPythonLanguageServer();

        case "javascript":
            return createJavascriptLanguageServer();

        case "dart":
            return createDartLanguageServer();

        case "csharp":
            return createCsharpLanguageServer();

        default:
            throw new Error(`Unsupported language: ${language}`);
    }
}

function writeLspMessage(
    languageServer: ChildProcessWithoutNullStreams,
    payload: string
) {
    if (!languageServer.stdin.writable) {
        return;
    }

    const byteLength = Buffer.byteLength(payload, "utf8");
    languageServer.stdin.write(`Content-Length: ${byteLength}\r\n\r\n${payload}`);
}

function rawDataToString(data: RawData): string {
    if (Buffer.isBuffer(data)) {
        return data.toString("utf8");
    }

    if (Array.isArray(data)) {
        return Buffer.concat(data).toString("utf8");
    }

    return Buffer.from(data).toString("utf8");
}

function pipeLanguageServerToWebSocket(
    languageServer: ChildProcessWithoutNullStreams,
    socket: WebSocket
) {
    let buffer = Buffer.alloc(0);

    languageServer.stdout.on("data", (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (true) {
            const headerEndIndex = buffer.indexOf("\r\n\r\n");

            if (headerEndIndex === -1) {
                break;
            }

            const header = buffer.slice(0, headerEndIndex).toString("utf8");
            const contentLengthMatch = /Content-Length:\s*(\d+)/i.exec(header);

            if (!contentLengthMatch) {
                buffer = buffer.slice(headerEndIndex + 4);
                continue;
            }

            const contentLength = Number(contentLengthMatch[1]);
            const messageStartIndex = headerEndIndex + 4;
            const messageEndIndex = messageStartIndex + contentLength;

            if (buffer.length < messageEndIndex) {
                break;
            }

            const body = buffer
                .slice(messageStartIndex, messageEndIndex)
                .toString("utf8");

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(body);
            }

            buffer = buffer.slice(messageEndIndex);
        }
    });
}

function stopLanguageServer(languageServer: ChildProcessWithoutNullStreams) {
    if (!languageServer.killed) {
        languageServer.kill();
    }
}

wss.on("connection", (socket, request) => {
    const language = getLanguageFromUrl(request.url);

    if (!language) {
        socket.close(1008, "Unsupported language");
        return;
    }

    let languageServer: ChildProcessWithoutNullStreams;

    try {
        languageServer = createLanguageServer(language);
    } catch (error) {
        console.error(`[${language} lsp] failed to start`, error);

        if (socket.readyState === WebSocket.OPEN) {
            socket.close(1011, "Failed to start language server");
        }

        return;
    }

    pipeLanguageServerToWebSocket(languageServer, socket);

    languageServer.stderr.on("data", (chunk: Buffer) => {
        console.error(`[${language} lsp] ${chunk.toString("utf8")}`);
    });

    languageServer.on("error", (error) => {
        console.error(`[${language} lsp] spawn error`, error);

        if (socket.readyState === WebSocket.OPEN) {
            socket.close(1011, "Language server error");
        }
    });

    languageServer.on("exit", (code, signal) => {
        console.log(`[${language} lsp] exited. code=${code}, signal=${signal}`);

        if (socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
    });

    languageServer.stdin.on("error", (error) => {
        console.error(`[${language} lsp] stdin error`, error);
    });

    socket.on("message", (data) => {
        const message = rawDataToString(data);
        writeLspMessage(languageServer, message);
    });

    socket.on("close", () => {
        stopLanguageServer(languageServer);
    });

    socket.on("error", () => {
        stopLanguageServer(languageServer);
    });
});

server.listen(PORT, () => {
    console.log(`LSP WebSocket proxy running on ws://localhost:${PORT}/lsp`);
    console.log("Supported languages: cpp, java, python, javascript, dart, csharp");
    console.log(`clangd: ${CLANGD_COMMAND}`);
    console.log(`pyright: ${PYRIGHT_COMMAND}`);
    console.log(`java: ${JAVA_COMMAND}`);
    console.log(`jdtls: ${JDTLS_HOME}`);
});