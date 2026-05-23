"use client";

import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    Notice,
    SidePanel
} from "@/components/ui";
import { FilterSelect } from "@/components/forms";
import {
    DifficultyBadge,
    ProblemStatusBadge,
    SubmissionStatusBadge,
    type Difficulty,
    type ProblemStatus,
    type SubmissionStatus
} from "@/components/domain";
import JudgeMonacoEditor from "@/components/editor/JudgeMonacoEditor";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    Clipboard,
    Clock3,
    Copy,
    FileCode2,
    History,
    ListChecks,
    MemoryStick,
    NotebookPen,
    Play,
    RotateCcw,
    Save,
    Send,
    ShieldCheck,
    Terminal,
    Timer,
    Trophy
} from "lucide-react";

type ProblemCategory = string;

type Language =
    | "C++17"
    | "Python 3.12"
    | "Java 17"
    | "JavaScript"
    | "Dart"
    | "C# 12";

type RunStatus =
    | "idle"
    | "running"
    | "pending"
    | "judging"
    | "accepted"
    | "wrong"
    | "compile"
    | "runtime"
    | "timeLimit"
    | "memoryLimit";

type ProblemTab = "description" | "examples" | "hints";
type ConsoleTab = "result" | "custom" | "settings";

type ProblemExample = {
    id?: number;
    input: string;
    output: string;
    explanation?: string;
};

type ProblemDetail = {
    dbId: number;
    id: number;
    number: number;
    slug?: string;
    title: string;
    difficulty: Difficulty;
    category: ProblemCategory;
    score: number;
    status: ProblemStatus;
    solvedRate: number;
    submissions: number;
    accepted: number;
    timeLimit: string;
    memoryLimit: string;
    timeLimitMs: number;
    memoryLimitMb: number;
    compareMode: string;
    tags: string[];
    memo: string;
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string[];
    examples: ProblemExample[];
    hints: string[];
};

type ApiProblemDetail = Partial<
    Omit<ProblemDetail, "difficulty" | "status" | "examples">
> & {
    difficulty?: string;
    status?: string;
    examples?: ProblemExample[];
};

type ProblemApiResponse = {
    ok: boolean;
    message?: string;
    problem?: ApiProblemDetail;
};

type JudgeResult = {
    id: string;
    label: string;
    status: SubmissionStatus;
    time: string;
    memory: string;
    message: string;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
};

type JudgeMode = "run" | "submit";

type JudgeApiStatus =
    | "accepted"
    | "wrong"
    | "compile"
    | "runtime"
    | "timeLimit"
    | "memoryLimit"
    | "pending"
    | "judging";

type JudgeApiCaseResult = {
    id?: string;
    label?: string;
    status: JudgeApiStatus;
    timeMs?: number;
    memoryKb?: number;
    message?: string;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
};

type JudgeApiResponse = {
    ok?: boolean;
    mode?: JudgeMode;
    status: JudgeApiStatus;
    submissionId?: number;
    queueJobId?: string;
    message?: string;
    href?: string;
    results?: JudgeApiCaseResult[];
};

const LANGUAGE_OPTIONS: readonly Language[] = [
    "C++17",
    "Python 3.12",
    "Java 17",
    "JavaScript",
    "Dart",
    "C# 12"
];

const DEFAULT_CODE: Record<Language, string> = {
    "C++17": `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int a, b;
    cin >> a >> b;
    cout << a + b << '\\n';
    return 0;
}
`,
    "Python 3.12": `a, b = map(int, input().split())
print(a + b)
`,
    "Java 17": `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st = new StringTokenizer(br.readLine());
        int a = Integer.parseInt(st.nextToken());
        int b = Integer.parseInt(st.nextToken());
        System.out.println(a + b);
    }
}
`,
    JavaScript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
console.log(input[0] + input[1]);
`,
    Dart: `import 'dart:io';

void main() {
  final input = stdin.readAsStringSync().trim().split(RegExp(r'\\s+'));

  final a = int.parse(input[0]);
  final b = int.parse(input[1]);

  print(a + b);
}
`,
    "C# 12": `using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

public class Program
{
    public static void Main()
    {
        var input = Console.In.ReadToEnd()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)
            .Select(int.Parse)
            .ToArray();

        Console.WriteLine(input[0] + input[1]);
    }
}
`
};

const languageSettings: Record<Language, { compile: string; run: string; ext: string }> = {
    "C++17": {
        compile: "g++ -std=c++17 -O2 -pipe",
        run: "./main",
        ext: "cpp"
    },
    "Python 3.12": {
        compile: "-",
        run: "python3 main.py",
        ext: "py"
    },
    "Java 17": {
        compile: "javac Main.java",
        run: "java Main",
        ext: "java"
    },
    JavaScript: {
        compile: "-",
        run: "node main.js",
        ext: "js"
    },
    Dart: {
        compile: "-",
        run: "dart main.dart",
        ext: "dart"
    },
    "C# 12": {
        compile: "dotnet build -c Release",
        run: "dotnet run -c Release --no-build",
        ext: "cs"
    }
};

const monacoLanguageMap: Record<Language, string> = {
    "C++17": "cpp",
    "Python 3.12": "python",
    "Java 17": "java",
    JavaScript: "javascript",
    Dart: "dart",
    "C# 12": "csharp"
};

const problemTabLabels: Record<ProblemTab, string> = {
    description: "문제",
    examples: "예제",
    hints: "힌트"
};

const consoleTabLabels: Record<ConsoleTab, string> = {
    result: "실행 결과",
    custom: "사용자 입력",
    settings: "환경"
};

function normalizeDifficulty(value: unknown): Difficulty {
    const text = String(value ?? "").trim();

    if (text === "Easy" || text === "Medium" || text === "Hard") {
        return text;
    }

    if (text === "초급") return "Easy";
    if (text === "중급") return "Medium";
    if (text === "고급") return "Hard";

    return "Easy";
}

function normalizeProblemStatus(value: unknown): ProblemStatus {
    const text = String(value ?? "").trim();

    if (text === "solved" || text === "wrong" || text === "todo") {
        return text;
    }

    return "todo";
}

function formatTimeLimitFromMs(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) return "1초";
    if (ms % 1000 === 0) return `${ms / 1000}초`;
    return `${ms}ms`;
}

function formatMemoryLimitFromMb(mb: number) {
    if (!Number.isFinite(mb) || mb <= 0) return "256MB";
    return `${mb}MB`;
}

function normalizeProblemFromApi(problem: ApiProblemDetail): ProblemDetail {
    const dbId = Number(problem.dbId ?? problem.id ?? 0);
    const number = Number(problem.number ?? problem.id ?? 0);
    const timeLimitMs = Number(problem.timeLimitMs ?? 1000);
    const memoryLimitMb = Number(problem.memoryLimitMb ?? 256);

    return {
        dbId,
        id: number,
        number,
        slug: problem.slug,
        title: problem.title ?? "제목 없음",
        difficulty: normalizeDifficulty(problem.difficulty),
        category: problem.category ?? "구현",
        score: Number(problem.score ?? 100),
        status: normalizeProblemStatus(problem.status),
        solvedRate: Number(problem.solvedRate ?? 0),
        submissions: Number(problem.submissions ?? 0),
        accepted: Number(problem.accepted ?? 0),
        timeLimit: problem.timeLimit ?? formatTimeLimitFromMs(timeLimitMs),
        memoryLimit: problem.memoryLimit ?? formatMemoryLimitFromMb(memoryLimitMb),
        timeLimitMs,
        memoryLimitMb,
        compareMode: problem.compareMode ?? "default",
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        memo: problem.memo ?? "",
        description: problem.description ?? "",
        inputDescription: problem.inputDescription ?? "",
        outputDescription: problem.outputDescription ?? "",
        constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
        examples: Array.isArray(problem.examples) ? problem.examples : [],
        hints: Array.isArray(problem.hints) ? problem.hints : []
    };
}

async function fetchProblem(id: string): Promise<ProblemDetail> {
    const response = await fetch(`/api/problems/${id}`, {
        method: "GET",
        cache: "no-store"
    });

    const data = (await response.json()) as ProblemApiResponse;

    if (!response.ok || !data.ok || !data.problem) {
        throw new Error(data.message ?? "문제를 불러오지 못했습니다.");
    }

    return normalizeProblemFromApi(data.problem);
}

function getRunStatusNotice(status: RunStatus) {
    switch (status) {
        case "running":
            return {
                variant: "warning" as const,
                message: "코드를 실행하는 중입니다."
            };

        case "pending":
            return {
                variant: "warning" as const,
                message: "제출이 채점 대기열에 등록되었습니다."
            };

        case "judging":
            return {
                variant: "warning" as const,
                message: "채점 서버가 코드를 채점하고 있습니다."
            };

        case "accepted":
            return {
                variant: "success" as const,
                message: "정답입니다."
            };

        case "wrong":
            return {
                variant: "danger" as const,
                message: "실행 결과가 정답과 다릅니다."
            };

        case "compile":
            return {
                variant: "danger" as const,
                message: "컴파일 오류가 발생했습니다."
            };

        case "runtime":
            return {
                variant: "danger" as const,
                message: "런타임 에러가 발생했습니다."
            };

        case "timeLimit":
            return {
                variant: "danger" as const,
                message: "시간 제한을 초과했습니다."
            };

        case "memoryLimit":
            return {
                variant: "danger" as const,
                message: "메모리 제한을 초과했습니다."
            };

        case "idle":
        default:
            return {
                variant: "info" as const,
                message: "아직 실행하지 않았습니다."
            };
    }
}

function toRunStatus(status: JudgeApiStatus): RunStatus {
    switch (status) {
        case "accepted":
            return "accepted";

        case "wrong":
            return "wrong";

        case "compile":
            return "compile";

        case "runtime":
            return "runtime";

        case "timeLimit":
            return "timeLimit";

        case "memoryLimit":
            return "memoryLimit";

        case "pending":
            return "pending";

        case "judging":
            return "judging";

        default:
            return "idle";
    }
}

function toSubmissionStatus(status: JudgeApiStatus): SubmissionStatus {
    switch (status) {
        case "accepted":
            return "accepted";

        case "wrong":
            return "wrong";

        case "compile":
            return "compile";

        case "runtime":
            return "runtime";

        case "timeLimit":
        case "memoryLimit":
            return "timeLimit";

        case "pending":
            return "pending";

        case "judging":
            return "judging";

        default:
            return "wrong";
    }
}

function formatJudgeTime(timeMs?: number) {
    return typeof timeMs === "number" ? `${timeMs}ms` : "-";
}

function formatJudgeMemory(memoryKb?: number) {
    return typeof memoryKb === "number" ? `${memoryKb.toLocaleString()}KB` : "-";
}

async function requestJudgeApi({
                                   mode,
                                   problem,
                                   language,
                                   code,
                                   customInput
                               }: {
    mode: JudgeMode;
    problem: ProblemDetail;
    language: Language;
    code: string;
    customInput: string;
}): Promise<JudgeApiResponse> {
    const hasCustomInput = customInput.trim().length > 0;

    const tests =
        mode === "run" && hasCustomInput
            ? [
                {
                    id: "custom-1",
                    label: "사용자 입력",
                    input: customInput,
                    expectedOutput: ""
                }
            ]
            : problem.examples.map((example, index) => ({
                id: `sample-${index + 1}`,
                label: `예제 ${index + 1}`,
                input: example.input,
                expectedOutput: example.output
            }));

    const response = await fetch("/api/judge", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mode,
            problemId: problem.dbId,
            problemNumber: problem.number,
            problemTitle: problem.title,
            language,
            sourceFile: `Main.${languageSettings[language].ext}`,
            code,
            tests,
            timeLimit: problem.timeLimit,
            memoryLimit: problem.memoryLimit,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
            compareMode: problem.compareMode
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "채점 서버 요청에 실패했습니다.");
    }

    return response.json() as Promise<JudgeApiResponse>;
}

function getDefaultJudgeMessage(status: JudgeApiStatus) {
    switch (status) {
        case "accepted":
            return "정답입니다.";

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

        case "pending":
            return "채점 대기열에 등록되었습니다.";

        case "judging":
            return "채점 중입니다.";

        default:
            return "채점 결과를 확인하세요.";
    }
}

function convertJudgeResults(apiResults?: JudgeApiCaseResult[]): JudgeResult[] {
    if (!Array.isArray(apiResults)) {
        return [];
    }

    return apiResults.map((item, index) => ({
        id: item.id ?? `case-${index + 1}`,
        label: item.label ?? `테스트 ${index + 1}`,
        status: toSubmissionStatus(item.status),
        time: formatJudgeTime(item.timeMs),
        memory: formatJudgeMemory(item.memoryKb),
        message: item.message ?? getDefaultJudgeMessage(item.status),
        input: item.input ?? "",
        expectedOutput: item.expectedOutput ?? "",
        actualOutput: item.actualOutput ?? ""
    }));
}

function makeQueuedResult({
                              data,
                              isSubmit
                          }: {
    data: JudgeApiResponse;
    isSubmit: boolean;
}): JudgeResult {
    const status = data.status ?? "pending";

    return {
        id: data.submissionId ? `submission-${data.submissionId}` : "queued",
        label: data.submissionId
            ? `${isSubmit ? "제출" : "실행"} #${data.submissionId}`
            : isSubmit
                ? "제출"
                : "실행",
        status: toSubmissionStatus(status),
        time: "-",
        memory: "-",
        message:
            data.message ??
            (status === "pending"
                ? "제출이 큐에 등록되었습니다. judgeWorker가 pending 제출을 가져가 채점합니다."
                : status === "judging"
                    ? "채점 서버가 코드를 채점하고 있습니다."
                    : getDefaultJudgeMessage(status)),
        input: "",
        expectedOutput: "",
        actualOutput: ""
    };
}

function NotFoundProblem({ id, message }: { id: string; message?: string }) {
    return (
        <AppShell title="문제를 찾을 수 없습니다" description="요청한 문제가 현재 DB에 없습니다.">
            <EmptyState
                title={`#${id} 문제를 찾을 수 없습니다.`}
                description={message ?? "문제 번호를 다시 확인하거나 문제 검색 페이지로 돌아가세요."}
                icon={BookOpen}
                action={
                    <AppLinkButton href="/problems" variant="dark" icon={ArrowLeft}>
                        문제 검색으로 돌아가기
                    </AppLinkButton>
                }
            />
        </AppShell>
    );
}

function LoadingProblem() {
    return (
        <AppShell
            title="문제를 불러오는 중입니다"
            description="DB에서 문제 정보를 가져오고 있습니다."
            fullWidth
            contentClassName="py-4"
        >
            <Card className="p-6">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <BookOpen className="h-5 w-5" />
                    문제 정보를 불러오는 중입니다.
                </div>
            </Card>
        </AppShell>
    );
}

function ExamTopBar({
                        problem,
                        language,
                        runStatus,
                        onRun,
                        onSubmit
                    }: {
    problem: ProblemDetail;
    language: Language;
    runStatus: RunStatus;
    onRun: () => void;
    onSubmit: () => void;
}) {
    const isBusy =
        runStatus === "running" ||
        runStatus === "pending" ||
        runStatus === "judging";

    return (
        <Card className="sticky top-20 z-20 overflow-hidden border-slate-200 bg-white/95 backdrop-blur-xl lg:top-[76px]">
            <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link
                        href={`/problems/${problem.id}`}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        문제 상세
                    </Link>

                    <Badge variant="blue">#{problem.number}</Badge>
                    <DifficultyBadge value={problem.difficulty} />
                    <ProblemStatusBadge value={problem.status} />
                    <Badge>{problem.category}</Badge>
                    <Badge>{language}</Badge>
                </div>

                <div className="min-w-0 flex-1 xl:px-4">
                    <div className="truncate text-base font-black text-slate-950">
                        {problem.title}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                        <span>점수 {problem.score}</span>
                        <span>정답률 {problem.solvedRate}%</span>
                        <span>시간 {problem.timeLimit}</span>
                        <span>메모리 {problem.memoryLimit}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-700">
                        <Clock3 className="h-4 w-4 text-blue-600" />
                        01:58:23
                    </div>

                    <AppButton
                        variant="secondary"
                        icon={Play}
                        onClick={onRun}
                        disabled={isBusy}
                    >
                        실행
                    </AppButton>

                    <AppButton
                        variant="primary"
                        icon={Send}
                        onClick={onSubmit}
                        disabled={isBusy}
                    >
                        제출
                    </AppButton>
                </div>
            </div>
        </Card>
    );
}

function ProblemPanel({
                          problem,
                          activeTab,
                          onTabChange,
                          onUseSample
                      }: {
    problem: ProblemDetail;
    activeTab: ProblemTab;
    onTabChange: (tab: ProblemTab) => void;
    onUseSample: (input: string) => void;
}) {
    return (
        <Card className="flex min-h-[calc(100vh-190px)] flex-col overflow-hidden">
            <div className="border-b border-slate-100 bg-white p-3">
                <div className="grid grid-cols-3 gap-2">
                    {(["description", "examples", "hints"] as ProblemTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => onTabChange(tab)}
                            className={`rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                                activeTab === tab
                                    ? "bg-slate-950 text-white"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                        >
                            {problemTabLabels[tab]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {activeTab === "description" && <ProblemDescription problem={problem} />}
                {activeTab === "examples" && (
                    <ProblemExamples problem={problem} onUseSample={onUseSample} />
                )}
                {activeTab === "hints" && <ProblemHints problem={problem} />}
            </div>
        </Card>
    );
}

function ProblemDescription({ problem }: { problem: ProblemDetail }) {
    return (
        <div className="space-y-5">
            <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {problem.tags.map((tag) => (
                        <Link key={tag} href={`/problems?tag=${tag}`}>
                            <Badge>{tag}</Badge>
                        </Link>
                    ))}
                </div>

                <h2 className="text-2xl font-black text-slate-950">{problem.title}</h2>
                <p className="mt-4 text-sm leading-8 text-slate-600">
                    {problem.description || "등록된 문제 설명이 없습니다."}
                </p>
            </div>

            <section className="rounded-3xl bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">입력</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                    {problem.inputDescription || "등록된 입력 설명이 없습니다."}
                </p>
            </section>

            <section className="rounded-3xl bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">출력</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                    {problem.outputDescription || "등록된 출력 설명이 없습니다."}
                </p>
            </section>

            <section className="rounded-3xl bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">제한</h3>
                {problem.constraints.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                        {problem.constraints.map((constraint) => (
                            <li key={constraint} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                <span>{constraint}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-sm text-slate-500">등록된 제한 조건이 없습니다.</p>
                )}
            </section>
        </div>
    );
}

function ProblemExamples({
                             problem,
                             onUseSample
                         }: {
    problem: ProblemDetail;
    onUseSample: (input: string) => void;
}) {
    if (problem.examples.length === 0) {
        return (
            <EmptyState
                title="등록된 예제가 없습니다."
                description="DB의 TestCase 중 isSample=true인 항목이 예제로 표시됩니다."
                icon={Clipboard}
            />
        );
    }

    return (
        <div className="space-y-4">
            {problem.examples.map((example, index) => (
                <Card key={example.id ?? index} className="overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="font-black text-slate-950">예제 {index + 1}</h3>
                            <AppButton
                                variant="secondary"
                                size="sm"
                                icon={Clipboard}
                                onClick={() => onUseSample(example.input)}
                            >
                                입력 사용
                            </AppButton>
                        </div>
                    </div>

                    <ExampleBlock title="입력" value={example.input} />
                    <ExampleBlock title="출력" value={example.output} />

                    {example.explanation && (
                        <p className="border-t border-slate-100 p-4 text-sm leading-7 text-slate-500">
                            {example.explanation}
                        </p>
                    )}
                </Card>
            ))}
        </div>
    );
}

function ProblemHints({ problem }: { problem: ProblemDetail }) {
    if (problem.hints.length === 0) {
        return (
            <EmptyState
                title="등록된 힌트가 없습니다."
                description="DB에 힌트를 추가하면 이 영역에 표시됩니다."
                icon={NotebookPen}
            />
        );
    }

    return (
        <div className="space-y-3">
            {problem.hints.map((hint, index) => (
                <div
                    key={`${hint}-${index}`}
                    className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600"
                >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-600">
                        {index + 1}
                    </span>
                    {hint}
                </div>
            ))}
        </div>
    );
}

function ExampleBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="border-b border-slate-100 p-4 last:border-b-0">
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-950">{title}</h4>
                <Badge>{title === "입력" ? "stdin" : "stdout"}</Badge>
            </div>

            <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                <code>{value}</code>
            </pre>
        </div>
    );
}

function EditorPanel({
                         language,
                         onLanguageChange,
                         code,
                         onCodeChange,
                         onCopy,
                         onReset,
                         onSave
                     }: {
    language: Language;
    onLanguageChange: (language: Language) => void;
    code: string;
    onCodeChange: (code: string) => void;
    onCopy: () => void;
    onReset: () => void;
    onSave: () => void;
}) {
    const codeLines = code.split("\n").length;
    const languageInfo = languageSettings[language];

    return (
        <Card className="relative z-10 flex min-h-[calc(100vh-190px)] flex-col overflow-visible">
            <div className="flex flex-col gap-3 rounded-t-3xl border-b border-slate-100 bg-white p-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid gap-3 sm:grid-cols-[220px_1fr] xl:flex xl:items-end">
                    <FilterSelect
                        label="언어"
                        value={language}
                        onChange={onLanguageChange}
                        options={LANGUAGE_OPTIONS}
                    />

                    <div className="flex flex-wrap gap-2 xl:pb-0.5">
                        <Badge variant="blue">Main.{languageInfo.ext}</Badge>
                        <Badge>
                            {languageInfo.compile === "-" ? "인터프리터" : languageInfo.compile}
                        </Badge>
                        <Badge>{languageInfo.run}</Badge>
                        <Badge>{codeLines} lines</Badge>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Copy} onClick={onCopy}>
                        복사
                    </AppButton>

                    <AppButton variant="secondary" icon={RotateCcw} onClick={onReset}>
                        초기화
                    </AppButton>

                    <AppButton variant="secondary" icon={Save} onClick={onSave}>
                        저장
                    </AppButton>
                </div>
            </div>

            <div className="relative flex-1 overflow-visible rounded-b-3xl bg-slate-950">
                <JudgeMonacoEditor
                    key={`${language}-${languageSettings[language].ext}`}
                    height="calc(100vh - 285px)"
                    theme="vs-dark"
                    language={monacoLanguageMap[language]}
                    judgeLanguage={language}
                    fileName={`Main.${languageSettings[language].ext}`}
                    value={code}
                    onChange={onCodeChange}
                    options={{
                        minimap: {
                            enabled: true
                        },
                        fixedOverflowWidgets: true
                    }}
                />
            </div>
        </Card>
    );
}

function ConsolePanel({
                          activeTab,
                          onTabChange,
                          customInput,
                          onCustomInputChange,
                          runStatus,
                          results,
                          language,
                          problem,
                          onRun,
                          onSubmit
                      }: {
    activeTab: ConsoleTab;
    onTabChange: (tab: ConsoleTab) => void;
    customInput: string;
    onCustomInputChange: (value: string) => void;
    runStatus: RunStatus;
    results: JudgeResult[];
    language: Language;
    problem: ProblemDetail;
    onRun: () => void;
    onSubmit: () => void;
}) {
    const notice = getRunStatusNotice(runStatus);
    const languageInfo = languageSettings[language];
    const isBusy =
        runStatus === "running" ||
        runStatus === "pending" ||
        runStatus === "judging";

    return (
        <Card className="flex min-h-[calc(100vh-190px)] flex-col overflow-hidden">
            <div className="border-b border-slate-100 bg-white p-3">
                <div className="grid grid-cols-3 gap-2">
                    {(["result", "custom", "settings"] as ConsoleTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => onTabChange(tab)}
                            className={`rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                                activeTab === tab
                                    ? "bg-slate-950 text-white"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                        >
                            {consoleTabLabels[tab]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {activeTab === "result" && (
                    <>
                        <Notice variant={notice.variant} title="실행 상태">
                            {notice.message}
                        </Notice>
                        <ResultList results={results} />
                    </>
                )}

                {activeTab === "custom" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-black text-slate-950">사용자 입력</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                예제 외 직접 테스트할 입력을 작성합니다.
                            </p>
                        </div>

                        <textarea
                            value={customInput}
                            onChange={(event) => onCustomInputChange(event.target.value)}
                            className="min-h-64 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 outline-none ring-blue-100 transition focus:border-blue-300 focus:bg-white focus:ring-4"
                            placeholder="사용자 입력을 작성하세요."
                        />

                        <AppButton
                            variant="primary"
                            icon={Play}
                            onClick={onRun}
                            disabled={isBusy}
                        >
                            사용자 입력 실행
                        </AppButton>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="space-y-3">
                        <SettingRow label="언어" value={language} />
                        <SettingRow label="파일" value={`Main.${languageInfo.ext}`} />
                        <SettingRow label="컴파일" value={languageInfo.compile} />
                        <SettingRow label="실행" value={languageInfo.run} />
                        <SettingRow label="시간 제한" value={problem.timeLimit} />
                        <SettingRow label="메모리 제한" value={problem.memoryLimit} />
                    </div>
                )}
            </div>

            <div className="border-t border-slate-100 bg-white p-4">
                <div className="grid grid-cols-2 gap-3">
                    <AppButton
                        variant="secondary"
                        icon={Play}
                        onClick={onRun}
                        disabled={isBusy}
                    >
                        실행
                    </AppButton>

                    <AppButton
                        variant="primary"
                        icon={Send}
                        onClick={onSubmit}
                        disabled={isBusy}
                    >
                        제출
                    </AppButton>
                </div>
            </div>
        </Card>
    );
}

function ResultOutputBlock({
                               title,
                               value,
                               emptyText
                           }: {
    title: string;
    value?: string;
    emptyText: string;
}) {
    const text = value && value.length > 0 ? value : emptyText;

    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">{title}</span>
                <Badge>{title}</Badge>
            </div>

            <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-6 text-slate-100">
                <code>{text}</code>
            </pre>
        </div>
    );
}

function ResultList({ results }: { results: JudgeResult[] }) {
    if (results.length === 0) {
        return (
            <Card className="p-5">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <Terminal className="h-5 w-5" />
                    실행 결과가 여기에 표시됩니다.
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {results.map((result) => {
                const hasInput = typeof result.input === "string" && result.input.length > 0;
                const hasExpected =
                    typeof result.expectedOutput === "string" &&
                    result.expectedOutput.length > 0;
                const hasActual =
                    typeof result.actualOutput === "string" &&
                    result.actualOutput.length > 0;

                const shouldShowOutput = hasInput || hasExpected || hasActual;

                return (
                    <Card key={result.id} className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <SubmissionStatusBadge value={result.status} />
                                <span className="text-sm font-black text-slate-800">
                                    {result.label}
                                </span>
                            </div>

                            <div className="flex gap-2 text-xs font-bold text-slate-400">
                                <span>{result.time}</span>
                                <span>{result.memory}</span>
                            </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            {result.message}
                        </p>

                        {shouldShowOutput && (
                            <div className="mt-4 space-y-3">
                                <ResultOutputBlock
                                    title="입력"
                                    value={result.input}
                                    emptyText="입력 없음"
                                />

                                <ResultOutputBlock
                                    title="기대 출력"
                                    value={result.expectedOutput}
                                    emptyText="기대 출력 없음"
                                />

                                <ResultOutputBlock
                                    title="실제 출력"
                                    value={result.actualOutput}
                                    emptyText="출력 없음"
                                />
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}

function SettingRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold">
            <span className="shrink-0 text-slate-400">{label}</span>
            <span className="break-all text-right text-slate-700">{value}</span>
        </div>
    );
}

function QuickLink({
                       href,
                       label,
                       icon: Icon
                   }: {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
        >
            <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
            </span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

function CompactInfoPanel({
                              problem,
                              codeBytes
                          }: {
    problem: ProblemDetail;
    codeBytes: number;
}) {
    return (
        <div className="grid gap-4 xl:grid-cols-4">
            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400">정답률</p>
                        <p className="text-lg font-black text-slate-950">
                            {problem.solvedRate}%
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <Timer className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400">시간 제한</p>
                        <p className="text-lg font-black text-slate-950">
                            {problem.timeLimit}
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white">
                        <MemoryStick className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400">메모리</p>
                        <p className="text-lg font-black text-slate-950">
                            {problem.memoryLimit}
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <FileCode2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400">코드 크기</p>
                        <p className="text-lg font-black text-slate-950">
                            {codeBytes.toLocaleString()}B
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function ProblemSolvePage() {
    const router = useRouter();

    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");

    const [problem, setProblem] = useState<ProblemDetail | null>(null);
    const [isLoadingProblem, setIsLoadingProblem] = useState(true);
    const [problemError, setProblemError] = useState<string | null>(null);

    const [language, setLanguage] = useState<Language>("C++17");
    const [code, setCode] = useState(DEFAULT_CODE["C++17"]);
    const [customInput, setCustomInput] = useState("");
    const [runStatus, setRunStatus] = useState<RunStatus>("idle");
    const [results, setResults] = useState<JudgeResult[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [problemTab, setProblemTab] = useState<ProblemTab>("description");
    const [consoleTab, setConsoleTab] = useState<ConsoleTab>("result");

    const codeBytes = useMemo(() => new Blob([code]).size, [code]);

    useEffect(() => {
        let alive = true;

        async function loadProblem() {
            setIsLoadingProblem(true);
            setProblemError(null);

            try {
                const nextProblem = await fetchProblem(id);

                if (!alive) return;

                setProblem(nextProblem);
                setCustomInput("");
                setRunStatus("idle");
                setResults([]);
            } catch (error) {
                if (!alive) return;

                setProblem(null);
                setProblemError(
                    error instanceof Error
                        ? error.message
                        : "문제를 불러오지 못했습니다."
                );
            } finally {
                if (alive) {
                    setIsLoadingProblem(false);
                }
            }
        }

        if (id) {
            void loadProblem();
        }

        return () => {
            alive = false;
        };
    }, [id]);

    if (isLoadingProblem) {
        return <LoadingProblem />;
    }

    if (problemError || !problem) {
        return <NotFoundProblem id={id} message={problemError ?? undefined} />;
    }

    const showMessage = (text: string) => {
        setMessage(text);
        window.setTimeout(() => setMessage(null), 1800);
    };

    const handleLanguageChange = (nextLanguage: Language) => {
        setLanguage(nextLanguage);
        setCode(DEFAULT_CODE[nextLanguage]);
        setRunStatus("idle");
        setResults([]);
    };

    const runJudge = async (isSubmit: boolean) => {
        setRunStatus("running");
        setConsoleTab("result");
        setResults([
            {
                id: "judging",
                label: isSubmit ? "제출" : "실행",
                status: "judging",
                time: "-",
                memory: "-",
                message: "채점 서버에서 코드를 실행하고 있습니다."
            }
        ]);

        try {
            const data = await requestJudgeApi({
                mode: isSubmit ? "submit" : "run",
                problem,
                language,
                code,
                customInput
            });

            const nextStatus = toRunStatus(data.status);

            setRunStatus(nextStatus);

            if (Array.isArray(data.results) && data.results.length > 0) {
                setResults(convertJudgeResults(data.results));
            } else {
                setResults([
                    makeQueuedResult({
                        data,
                        isSubmit
                    })
                ]);
            }

            if (isSubmit && data.submissionId) {
                router.push(`/problems/${problem.id}/submissions`);
                return;
            }

            showMessage(
                data.status === "accepted"
                    ? "실행 완료: 통과했습니다."
                    : data.message ?? "실행 완료: 결과를 확인하세요."
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "채점 중 알 수 없는 오류가 발생했습니다.";

            setRunStatus("runtime");
            setResults([
                {
                    id: "judge-error",
                    label: "채점 서버",
                    status: "runtime",
                    time: "-",
                    memory: "-",
                    message: errorMessage,
                    input: "",
                    expectedOutput: "",
                    actualOutput: ""
                }
            ]);

            showMessage("채점 서버 오류가 발생했습니다.");
        }
    };

    const handleResetCode = () => {
        setCode(DEFAULT_CODE[language]);
        setRunStatus("idle");
        setResults([]);
        showMessage("기본 코드로 초기화했습니다.");
    };

    const handleUseSampleInput = (input: string) => {
        setCustomInput(input);
        setConsoleTab("custom");
        showMessage("예제 입력을 사용자 입력에 복사했습니다.");
    };

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(code);
        showMessage("코드를 클립보드에 복사했습니다.");
    };

    return (
        <AppShell
            title="코딩 테스트"
            description={`${problem.number}. ${problem.title}`}
            fullWidth
            contentClassName="py-4"
        >
            <div className="space-y-4">
                <ExamTopBar
                    problem={problem}
                    language={language}
                    runStatus={runStatus}
                    onRun={() => void runJudge(false)}
                    onSubmit={() => void runJudge(true)}
                />

                {message && (
                    <Notice variant="success" title="알림">
                        {message}
                    </Notice>
                )}

                <CompactInfoPanel problem={problem} codeBytes={codeBytes} />

                <section className="grid gap-4 2xl:grid-cols-[390px_minmax(0,1fr)_390px]">
                    <ProblemPanel
                        problem={problem}
                        activeTab={problemTab}
                        onTabChange={setProblemTab}
                        onUseSample={handleUseSampleInput}
                    />

                    <EditorPanel
                        language={language}
                        onLanguageChange={handleLanguageChange}
                        code={code}
                        onCodeChange={setCode}
                        onCopy={handleCopyCode}
                        onReset={handleResetCode}
                        onSave={() => showMessage("임시 저장했습니다.")}
                    />

                    <ConsolePanel
                        activeTab={consoleTab}
                        onTabChange={setConsoleTab}
                        customInput={customInput}
                        onCustomInputChange={setCustomInput}
                        runStatus={runStatus}
                        results={results}
                        language={language}
                        problem={problem}
                        onRun={() => void runJudge(false)}
                        onSubmit={() => void runJudge(true)}
                    />
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <Card className="p-5">
                        <div className="mb-3 flex items-center gap-2 font-black text-slate-950">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                            코딩테스트 모드 안내
                        </div>

                        <p className="text-sm leading-7 text-slate-500">
                            이 화면은 DB의 문제 정보와 예제 테스트케이스를 불러와 실행합니다.
                            실행과 제출 버튼은 `/api/judge` 채점 API로 코드를 전송합니다.
                        </p>
                    </Card>

                    <SidePanel title="빠른 이동" badge={<History className="h-5 w-5 text-blue-600" />}>
                        <div className="space-y-2">
                            <QuickLink
                                href={`/problems/${problem.id}`}
                                label="문제 상세"
                                icon={BookOpen}
                            />

                            <QuickLink
                                href={`/problems/${problem.id}/submissions`}
                                label="이 문제 제출 기록"
                                icon={ListChecks}
                            />

                            <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                        </div>
                    </SidePanel>
                </section>
            </div>
        </AppShell>
    );
}
