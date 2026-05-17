// src/server/judge/languageConfig.ts

export type JudgeLanguage =
    | "c"
    | "cpp"
    | "python"
    | "javascript"
    | "java"
    | "csharp"
    | "dart";

export interface LanguageConfig {
    language: JudgeLanguage;
    displayName: string;
    fileName: string;
    dockerImage: string;
    compileCommand?: string;
    runCommand: string;
}

/**
 * 채점기에서 지원하는 언어 설정
 *
 * 현재 로컬 Docker 이미지 TAG가 전부 latest 기준이면
 * dockerImage를 명시적으로 xxx:latest 형태로 맞춥니다.
 */
export const LANGUAGE_CONFIG: Record<JudgeLanguage, LanguageConfig> = {
    c: {
        language: "c",
        displayName: "C11",
        fileName: "main.c",
        dockerImage: "gcc:latest",
        compileCommand: [
            "gcc",
            "main.c",
            "-O2",
            "-std=c11",
            "-Wall",
            "-Wextra",
            "-o",
            "main",
        ].join(" "),
        runCommand: "./main",
    },

    cpp: {
        language: "cpp",
        displayName: "C++17",
        fileName: "Main.cpp",
        dockerImage: "gcc:latest",
        compileCommand: [
            "g++",
            "Main.cpp",
            "-O2",
            "-std=c++17",
            "-Wall",
            "-Wextra",
            "-pipe",
            "-o",
            "main",
        ].join(" "),
        runCommand: "./main",
    },

    python: {
        language: "python",
        displayName: "Python 3",
        fileName: "main.py",
        dockerImage: "python:latest",
        runCommand: "python3 main.py",
    },

    javascript: {
        language: "javascript",
        displayName: "JavaScript Node.js",
        fileName: "main.js",
        dockerImage: "node:latest",
        runCommand: "node main.js",
    },

    java: {
        language: "java",
        displayName: "Java",
        fileName: "Main.java",
        dockerImage: "eclipse-temurin:latest",
        compileCommand: "javac Main.java",
        runCommand: "java Main",
    },

    csharp: {
        language: "csharp",
        displayName: "C# .NET",
        fileName: "Program.cs",
        dockerImage: "mcr.microsoft.com/dotnet/sdk:latest",
        compileCommand: [
            "cat > Judge.csproj <<'EOF'",
            "<Project Sdk=\"Microsoft.NET.Sdk\">",
            "  <PropertyGroup>",
            "    <OutputType>Exe</OutputType>",
            "    <TargetFramework>net8.0</TargetFramework>",
            "    <ImplicitUsings>enable</ImplicitUsings>",
            "    <Nullable>disable</Nullable>",
            "    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>",
            "  </PropertyGroup>",
            "</Project>",
            "EOF",
            "dotnet build Judge.csproj -c Release --nologo -v:q",
        ].join("\n"),
        runCommand: "dotnet ./bin/Release/net8.0/Judge.dll",
    },

    dart: {
        language: "dart",
        displayName: "Dart",
        fileName: "main.dart",
        dockerImage: "dart:latest",
        compileCommand: "dart compile exe main.dart -o main",
        runCommand: "./main",
    },
};

/**
 * DB나 프론트에서 들어온 언어명을 채점기 내부 언어명으로 변환합니다.
 */
export function normalizeLanguage(language: unknown): JudgeLanguage | null {
    const value = String(language ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    switch (value) {
        case "c":
        case "gcc":
        case "c11":
            return "c";

        case "cpp":
        case "c++":
        case "g++":
        case "cpp17":
        case "c++17":
        case "cplusplus":
            return "cpp";

        case "py":
        case "python":
        case "python3":
        case "python-3":
        case "python312":
        case "python3.12":
            return "python";

        case "js":
        case "node":
        case "nodejs":
        case "javascript":
        case "javascriptnode":
            return "javascript";

        case "java":
        case "jdk":
        case "openjdk":
        case "java17":
        case "java21":
            return "java";

        case "cs":
        case "c#":
        case "csharp":
        case "dotnet":
        case ".net":
        case "net":
            return "csharp";

        case "dart":
            return "dart";

        default:
            return null;
    }
}

/**
 * 언어 설정 가져오기
 */
export function getLanguageConfig(language: unknown): LanguageConfig | null {
    const normalized = normalizeLanguage(language);

    if (!normalized) {
        return null;
    }

    return LANGUAGE_CONFIG[normalized];
}

/**
 * 지원 언어 여부 확인
 */
export function isSupportedLanguage(language: unknown): boolean {
    return normalizeLanguage(language) !== null;
}

/**
 * 프론트 SelectBox에서 사용할 언어 목록
 */
export function getSupportedLanguages() {
    return Object.values(LANGUAGE_CONFIG).map((config) => ({
        value: config.language,
        label: config.displayName,
    }));
}