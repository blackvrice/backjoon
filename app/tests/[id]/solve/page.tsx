"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    MiniStat,
    Notice,
    ProgressBar
} from "@/components/ui";
import { FilterSelect } from "@/components/forms";
import {
    DifficultyBadge,
    ProblemStatusBadge,
    type Difficulty,
    type ProblemStatus
} from "@/components/domain";
import JudgeMonacoEditor from "@/components/editor/JudgeMonacoEditor";
import {
    ArrowLeft,
    BookOpen,
    Copy,
    Keyboard,
    Play,
    RotateCcw,
    Save,
    Search,
    Send,
    Sparkles,
    Terminal,
    Timer
} from "lucide-react";

type Language = "C++17" | "Python 3.12" | "Java 17" | "JavaScript" | "Dart" | "C# 12";
type ConsoleTab = "result" | "input" | "log" | "help";
type ProblemTab = "description" | "examples" | "constraints" | "notes";
type TestStatus = "scheduled" | "open" | "completed" | "review";

type ExampleCase = {
    input: string;
    output: string;
    explanation?: string;
};

type TestProblem = {
    dbId?: number;
    id: number;
    order: number;
    title: string;
    difficulty: Difficulty;
    status: ProblemStatus;
    points: number;
    estimatedMinutes: number;
    timeLimit: string;
    memoryLimit: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
    compareMode?: string;
    solvedRate: number;
    tags: string[];
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string[];
    notes: string[];
    examples: ExampleCase[];
    defaultCodes: Record<Language, string>;
};

type TestDetail = {
    id: string;
    title: string;
    description: string;
    status: TestStatus;
    durationMinutes: number;
    remainingSeconds: number;
    totalScore: number;
    currentScore: number;
    startedAtText: string;
    endAtText: string;
    problems: TestProblem[];
};

type RunResult = {
    status: "idle" | "running" | "accepted" | "wrong" | "compile";
    title: string;
    message: string;
    time: string;
    memory: string;
    output: string;
    logs: string[];
};

const LANGUAGE_OPTIONS: readonly Language[] = [
    "C++17",
    "Python 3.12",
    "Java 17",
    "JavaScript",
    "Dart",
    "C# 12"
];

const monacoLanguageMap: Record<Language, string> = {
    "C++17": "cpp",
    "Python 3.12": "python",
    "Java 17": "java",
    JavaScript: "javascript",
    Dart: "dart",
    "C# 12": "csharp"
};

const languageExtMap: Record<Language, string> = {
    "C++17": "cpp",
    "Python 3.12": "py",
    "Java 17": "java",
    JavaScript: "js",
    Dart: "dart",
    "C# 12": "cs"
};

const languageRunMap: Record<Language, { compile: string; run: string }> = {
    "C++17": {
        compile: "g++ -std=c++17 -O2 -pipe",
        run: "./main"
    },
    "Python 3.12": {
        compile: "-",
        run: "python3 main.py"
    },
    "Java 17": {
        compile: "javac Main.java",
        run: "java Main"
    },
    JavaScript: {
        compile: "-",
        run: "node main.js"
    },
    Dart: {
        compile: "-",
        run: "dart main.dart"
    },
    "C# 12": {
        compile: "dotnet build -c Release",
        run: "dotnet run -c Release --no-build"
    }
};

const createDefaultCodes = (title: string): Record<Language, string> => ({
    "C++17": `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // ${title}

    return 0;
}
`,
    "Python 3.12": `# ${title}
import sys
input = sys.stdin.readline


def main():
    pass


if __name__ == "__main__":
    main()
`,
    "Java 17": `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();

        // ${title}

        System.out.print(sb.toString());
    }
}
`,
    JavaScript: `// ${title}
const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);

let index = 0;

function main() {
  
}

main();
`,
    Dart: `// ${title}
import 'dart:io';

void main() {
  final input = stdin.readAsStringSync().trim().split(RegExp(r'\\s+'));
  var index = 0;

  // ${title}
}
`,
    "C# 12": `// ${title}
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

public class Program
{
    public static void Main()
    {
        var input = Console.In.ReadToEnd()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

        // ${title}
    }
}
`
});

const idleResult: RunResult = {
    status: "idle",
    title: "아직 실행하지 않았습니다.",
    message: "코드를 작성한 뒤 예제 실행 또는 제출을 눌러주세요.",
    time: "-",
    memory: "-",
    output: "",
    logs: ["Ready"]
};

function normalizeTestFromApi(data: unknown): TestDetail | null {
    const payload = data as {
        test?: Partial<TestDetail> & { durationMin?: number; myScore?: number | null; startAtText?: string };
        problems?: Array<Partial<TestProblem> & { hints?: string[] }>;
    } | null;
    const test = payload?.test;

    if (!test?.id || !test.title) {
        return null;
    }

    const rawProblems = (Array.isArray(test.problems) ? test.problems : payload?.problems ?? []) as Array<Partial<TestProblem> & { hints?: string[] }>;
    const problems = rawProblems.map((problem, index) => ({
        dbId: Number(problem.dbId ?? problem.id),
        id: Number(problem.id),
        order: Number(problem.order ?? index + 1),
        title: String(problem.title ?? ""),
        difficulty: (problem.difficulty === "Medium" || problem.difficulty === "Hard" ? problem.difficulty : "Easy") as Difficulty,
        status: (problem.status === "solved" || problem.status === "wrong" || problem.status === "review" ? problem.status : "todo") as ProblemStatus,
        points: Number(problem.points ?? 0),
        estimatedMinutes: Number(problem.estimatedMinutes ?? 0),
        timeLimit: String(problem.timeLimit ?? "-"),
        memoryLimit: String(problem.memoryLimit ?? "-"),
        timeLimitMs: Number(problem.timeLimitMs ?? 2000),
        memoryLimitMb: Number(problem.memoryLimitMb ?? 256),
        compareMode: String(problem.compareMode ?? "default"),
        solvedRate: Number(problem.solvedRate ?? 0),
        tags: Array.isArray(problem.tags) ? problem.tags.map(String) : [],
        description: String(problem.description ?? ""),
        inputDescription: String(problem.inputDescription ?? ""),
        outputDescription: String(problem.outputDescription ?? ""),
        constraints: Array.isArray(problem.constraints) ? problem.constraints.map(String) : [],
        notes: Array.isArray(problem.notes) ? problem.notes.map(String) : Array.isArray(problem.hints) ? problem.hints.map(String) : [],
        examples: Array.isArray(problem.examples) ? problem.examples.map((example) => ({
            input: String(example.input ?? ""),
            output: String(example.output ?? ""),
            explanation: example.explanation ? String(example.explanation) : undefined,
        })) : [],
        defaultCodes: problem.defaultCodes ?? createDefaultCodes(String(problem.title ?? "")),
    }));

    return {
        id: String(test.id),
        title: String(test.title),
        description: String(test.description ?? ""),
        status: (test.status === "scheduled" || test.status === "completed" || test.status === "review" ? test.status : "open") as TestStatus,
        durationMinutes: Number(test.durationMinutes ?? test.durationMin ?? 0),
        remainingSeconds: Number(test.remainingSeconds ?? Number(test.durationMinutes ?? test.durationMin ?? 0) * 60),
        totalScore: Number(test.totalScore ?? problems.reduce((sum, problem) => sum + problem.points, 0)),
        currentScore: Number(test.currentScore ?? test.myScore ?? 0),
        startedAtText: String(test.startedAtText ?? test.startAtText ?? "-"),
        endAtText: String(test.endAtText ?? "-"),
        problems,
    };
}

function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function getSolvedCount(test: TestDetail) {
    return test.problems.filter((problem) => problem.status === "solved").length;
}

function getProgress(test: TestDetail) {
    return Math.round((getSolvedCount(test) / Math.max(test.problems.length, 1)) * 100);
}

function getProblemScore(test: TestDetail) {
    return test.problems
        .filter((problem) => problem.status === "solved")
        .reduce((sum, problem) => sum + problem.points, 0);
}

function getNextUnsolvedProblem(test: TestDetail) {
    return test.problems.find((problem) => problem.status !== "solved") ?? test.problems[0];
}

function ProblemListItem({
                             problem,
                             active,
                             onClick
                         }: {
    problem: TestProblem;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-2xl border p-4 text-left transition ${
                active
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
            }`}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="blue">Q{problem.order}</Badge>
                <ProblemStatusBadge value={problem.status} />
            </div>

            <p className="line-clamp-1 font-black text-slate-950">
                {problem.title}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
                <DifficultyBadge value={problem.difficulty} />
                <Badge>{problem.points}점</Badge>
                <Badge>{problem.estimatedMinutes}분</Badge>
            </div>
        </button>
    );
}

function TestHeader({
                        test,
                        activeProblem,
                        onSubmit
                    }: {
    test: TestDetail;
    activeProblem: TestProblem;
    onSubmit: () => void;
}) {
    const progress = getProgress(test);

    return (
        <Card className="sticky top-0 z-30 rounded-none border-x-0 border-t-0 bg-white/95 px-4 py-3 backdrop-blur xl:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Link
                            href={`/tests/${test.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            테스트 상세
                        </Link>
                        <Badge variant="blue">Mock Test</Badge>
                        <Badge>{test.durationMinutes}분</Badge>
                        <Badge variant="orange">
                            <Timer className="mr-1 h-3.5 w-3.5" />
                            {formatTime(test.remainingSeconds)}
                        </Badge>
                    </div>

                    <h1 className="truncate text-xl font-black tracking-tight text-slate-950">
                        {test.title} · Q{activeProblem.order}. {activeProblem.title}
                    </h1>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-[220px] rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="mb-1 flex justify-between text-xs font-black text-slate-500">
                            <span>진행률</span>
                            <span>{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                    </div>

                    <AppButton variant="secondary" icon={Save}>
                        임시 저장
                    </AppButton>

                    <AppButton variant="primary" iconRight={Send} onClick={onSubmit}>
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
                          setActiveTab,
                          onUseExample
                      }: {
    problem: TestProblem;
    activeTab: ProblemTab;
    setActiveTab: (tab: ProblemTab) => void;
    onUseExample: (input: string) => void;
}) {
    const tabLabels: Record<ProblemTab, string> = {
        description: "문제",
        examples: "예제",
        constraints: "제약",
        notes: "메모"
    };

    return (
        <Card className="flex min-h-[calc(100vh-112px)] flex-col overflow-hidden">
            <div className="border-b border-slate-100 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="blue">Q{problem.order}</Badge>
                    <DifficultyBadge value={problem.difficulty} />
                    <Badge>{problem.points}점</Badge>
                    <Badge>{problem.timeLimit}</Badge>
                    <Badge>{problem.memoryLimit}</Badge>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {problem.title}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                        <Badge key={tag}>#{tag}</Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 border-b border-slate-100 p-2">
                {(["description", "examples", "constraints", "notes"] as ProblemTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                            activeTab === tab
                                ? "bg-slate-950 text-white"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                        }`}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-5">
                {activeTab === "description" && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 font-black text-slate-950">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                문제 설명
                            </h3>
                            <p className="text-sm leading-7 text-slate-600">
                                {problem.description}
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-3 font-black text-slate-950">입력</h3>
                            <p className="text-sm leading-7 text-slate-600">
                                {problem.inputDescription}
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-3 font-black text-slate-950">출력</h3>
                            <p className="text-sm leading-7 text-slate-600">
                                {problem.outputDescription}
                            </p>
                        </section>
                    </div>
                )}

                {activeTab === "examples" && (
                    <div className="space-y-4">
                        {problem.examples.map((example, index) => (
                            <Card key={`${problem.id}-example-${index}`} className="overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                                    <h3 className="font-black text-slate-950">
                                        예제 {index + 1}
                                    </h3>

                                    <AppButton
                                        size="sm"
                                        variant="secondary"
                                        icon={Copy}
                                        onClick={() => onUseExample(example.input)}
                                    >
                                        입력 복사
                                    </AppButton>
                                </div>

                                <div className="grid gap-0 xl:grid-cols-2">
                                    <ExampleBlock title="입력" value={example.input} />
                                    <ExampleBlock title="출력" value={example.output} />
                                </div>

                                {example.explanation && (
                                    <p className="border-t border-slate-100 p-4 text-sm leading-7 text-slate-500">
                                        {example.explanation}
                                    </p>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === "constraints" && (
                    <div className="space-y-2">
                        {problem.constraints.map((constraint) => (
                            <div
                                key={constraint}
                                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"
                            >
                                {constraint}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "notes" && (
                    <div className="space-y-2">
                        {problem.notes.map((note, index) => (
                            <div
                                key={note}
                                className="flex gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-800"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-600">
                                    {index + 1}
                                </span>
                                {note}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

function ExampleBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="border-b border-slate-100 p-4 xl:border-b-0 xl:border-r last:xl:border-r-0">
            <p className="mb-2 text-sm font-black text-slate-950">{title}</p>
            <pre className="max-h-60 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                <code>{value}</code>
            </pre>
        </div>
    );
}

function EditorPanel({
                         language,
                         setLanguage,
                         code,
                         setCode,
                         activeProblem,
                         onCopy,
                         onReset
                     }: {
    language: Language;
    setLanguage: (language: Language) => void;
    code: string;
    setCode: (code: string) => void;
    activeProblem: TestProblem;
    onCopy: () => void;
    onReset: () => void;
}) {
    const runInfo = languageRunMap[language];
    const ext = languageExtMap[language];
    const fileName = `Main.${ext}`;

    return (
        <Card className="relative z-10 flex flex-col overflow-visible">
            <div className="flex flex-col gap-3 rounded-t-3xl border-b border-slate-100 bg-white p-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="grid gap-3 sm:grid-cols-[220px_1fr] xl:flex xl:items-end">
                    <FilterSelect
                        label="언어"
                        value={language}
                        onChange={setLanguage}
                        options={LANGUAGE_OPTIONS}
                    />

                    <div className="flex flex-wrap gap-2 xl:pb-0.5">
                        <Badge variant="blue">{fileName}</Badge>
                        <Badge>{runInfo.compile === "-" ? "인터프리터" : runInfo.compile}</Badge>
                        <Badge>{runInfo.run}</Badge>
                        <Badge>{code.split("\n").length} lines</Badge>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Copy} onClick={onCopy}>
                        복사
                    </AppButton>

                    <AppButton variant="secondary" icon={RotateCcw} onClick={onReset}>
                        초기화
                    </AppButton>
                </div>
            </div>

            <div className="relative flex-1 overflow-visible rounded-b-3xl bg-slate-950">
                <JudgeMonacoEditor
                    key={`${activeProblem.id}-${language}`}
                    height="calc(100vh - 285px)"
                    theme="vs-dark"
                    language={monacoLanguageMap[language]}
                    judgeLanguage={language}
                    fileName={fileName}
                    value={code}
                    onChange={setCode}
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
                          setActiveTab,
                          customInput,
                          setCustomInput,
                          result,
                          onRun,
                          onSubmit
                      }: {
    activeTab: ConsoleTab;
    setActiveTab: (tab: ConsoleTab) => void;
    customInput: string;
    setCustomInput: (value: string) => void;
    result: RunResult;
    onRun: () => void;
    onSubmit: () => void;
}) {
    const tabLabels: Record<ConsoleTab, string> = {
        result: "결과",
        input: "입력",
        log: "로그",
        help: "도움말"
    };

    return (
        <Card className="flex flex-col overflow-hidden">
            <div className="border-b border-slate-100 p-3">
                <div className="mb-3 grid grid-cols-4 gap-2">
                    {(["result", "input", "log", "help"] as ConsoleTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                                activeTab === tab
                                    ? "bg-slate-950 text-white"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <AppButton variant="secondary" icon={Play} onClick={onRun}>
                        예제 실행
                    </AppButton>

                    <AppButton variant="primary" iconRight={Send} onClick={onSubmit}>
                        제출
                    </AppButton>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {activeTab === "result" && (
                    <div className="space-y-4">
                        <Notice
                            variant={
                                result.status === "accepted"
                                    ? "success"
                                    : result.status === "wrong" || result.status === "compile"
                                        ? "danger"
                                        : "info"
                            }
                            title={result.title}
                        >
                            {result.message}
                        </Notice>

                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="시간" value={result.time} />
                            <MiniStat label="메모리" value={result.memory} />
                        </div>

                        <div>
                            <p className="mb-2 font-black text-slate-950">출력</p>
                            <pre className="min-h-40 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                                <code>{result.output || "아직 출력이 없습니다."}</code>
                            </pre>
                        </div>
                    </div>
                )}

                {activeTab === "input" && (
                    <label className="block">
                        <span className="mb-2 block font-black text-slate-950">
                            사용자 입력
                        </span>
                        <textarea
                            value={customInput}
                            onChange={(event) => setCustomInput(event.target.value)}
                            placeholder="직접 테스트할 입력을 작성하세요."
                            className="min-h-[220px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100 outline-none ring-blue-100 transition placeholder:text-slate-500 focus:border-blue-300 focus:ring-4"
                        />
                    </label>
                )}

                {activeTab === "log" && (
                    <div className="space-y-2">
                        {result.logs.map((log, index) => (
                            <div
                                key={`${log}-${index}`}
                                className="rounded-2xl bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-600"
                            >
                                {log}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "help" && (
                    <div className="space-y-3">
                        <HelpItem
                            icon={Keyboard}
                            title="단축키"
                            description="Ctrl/Cmd + S는 임시 저장, Ctrl/Cmd + Enter는 실행으로 연결할 수 있습니다."
                        />

                        <HelpItem
                            icon={Terminal}
                            title="실행"
                            description="현재는 DB 테스트 데이터 기준 실행입니다. 실행/제출은 /api/judge와 연결됩니다."
                        />

                        <HelpItem
                            icon={Send}
                            title="제출"
                            description="제출 시 /api/tests/:id/submissions 또는 /api/submissions로 연결하면 됩니다."
                        />
                    </div>
                )}
            </div>
        </Card>
    );
}

function HelpItem({
                      icon: Icon,
                      title,
                      description
                  }: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-black text-slate-950">
                <Icon className="h-4 w-4 text-blue-600" />
                {title}
            </div>

            <p className="text-sm leading-7 text-slate-500">{description}</p>
        </div>
    );
}

function NotFoundTest({ id }: { id: string }) {
    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <EmptyState
                title={`/${id} 테스트를 찾을 수 없습니다.`}
                description="테스트 ID를 다시 확인하거나 모의 테스트 목록으로 돌아가세요."
                icon={Search}
                action={
                    <AppLinkButton href="/tests" variant="dark" icon={ArrowLeft}>
                        모의 테스트로 돌아가기
                    </AppLinkButton>
                }
            />
        </main>
    );
}

export default function TestSolvePage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");
    const [test, setTest] = useState<TestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [activeProblemId, setActiveProblemId] = useState(0);
    const [language, setLanguage] = useState<Language>("C++17");
    const [problemTab, setProblemTab] = useState<ProblemTab>("description");
    const [consoleTab, setConsoleTab] = useState<ConsoleTab>("result");
    const [customInput, setCustomInput] = useState("");
    const [result, setResult] = useState<RunResult>(idleResult);
    const [message, setMessage] = useState<string | null>(null);

    const activeProblem = useMemo(() => {
        if (!test) return undefined;
        return test.problems.find((problem) => problem.id === activeProblemId) ?? test.problems[0];
    }, [test, activeProblemId]);

    const [codes, setCodes] = useState<Record<number, Record<Language, string>>>({});

    useEffect(() => {
        let ignore = false;

        async function loadTest() {
            try {
                setIsLoading(true);

                const response = await fetch(`/api/tests/${encodeURIComponent(id)}`, { cache: "no-store" });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message ?? "테스트 데이터를 불러오지 못했습니다.");
                }

                const nextTest = normalizeTestFromApi(data);

                if (!nextTest) {
                    throw new Error("테스트 API 응답 형식이 올바르지 않습니다.");
                }

                if (!ignore) {
                    const initialProblem = getNextUnsolvedProblem(nextTest);
                    setTest(nextTest);
                    setActiveProblemId(initialProblem?.id ?? 0);
                    setCodes(Object.fromEntries(
                        nextTest.problems.map((problem) => [problem.id, problem.defaultCodes])
                    ) as Record<number, Record<Language, string>>);
                }
            } catch (error) {
                if (!ignore) {
                    console.error("Failed to load test solve data", error);
                    setTest(null);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        if (id) {
            void loadTest();
        }

        return () => {
            ignore = true;
        };
    }, [id]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 p-6">
                <Card className="p-6 text-sm font-bold text-slate-500">
                    테스트 풀이 데이터를 DB에서 불러오는 중입니다.
                </Card>
            </main>
        );
    }

    if (!test || !activeProblem) {
        return <NotFoundTest id={id} />;
    }

    const currentCode = codes[activeProblem.id]?.[language] ?? activeProblem.defaultCodes[language];
    const solvedCount = getSolvedCount(test);
    const progress = getProgress(test);
    const problemScore = getProblemScore(test);

    const showMessage = (text: string) => {
        setMessage(text);
        window.setTimeout(() => setMessage(null), 1600);
    };

    const setCurrentCode = (value: string) => {
        setCodes((current) => ({
            ...current,
            [activeProblem.id]: {
                ...current[activeProblem.id],
                [language]: value
            }
        }));
    };

    const handleSelectProblem = (problemId: number) => {
        setActiveProblemId(problemId);
        setProblemTab("description");
        setConsoleTab("result");
        setResult(idleResult);
    };

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(currentCode);
        showMessage("코드를 클립보드에 복사했습니다.");
    };

    const handleResetCode = () => {
        setCurrentCode(activeProblem.defaultCodes[language]);
        showMessage("현재 문제의 기본 코드로 초기화했습니다.");
    };

    const handleUseExample = (input: string) => {
        setCustomInput(input);
        setConsoleTab("input");
        showMessage("예제 입력을 사용자 입력에 복사했습니다.");
    };

    const handleRun = async () => {
        setConsoleTab("result");

        setResult({
            status: "accepted",
            title: "예제 실행 완료",
            message: "DB 샘플 데이터 기준 실행 결과입니다. /api/judge 연결로 실제 실행 결과를 표시할 수 있습니다.",
            time: "4ms",
            memory: "2024KB",
            output: activeProblem.examples[0]?.output ?? "",
            logs: [
                `[run] problem=${activeProblem.id}`,
                `[run] language=${language}`,
                `[run] input=${customInput ? "custom" : "empty"}`,
                "[run] completed"
            ]
        });
    };

    const handleSubmit = async () => {
        setConsoleTab("result");

        setResult({
            status: activeProblem.status === "wrong" ? "wrong" : "accepted",
            title: activeProblem.status === "wrong" ? "제출 결과: 오답" : "제출 결과: 맞았습니다",
            message:
                activeProblem.status === "wrong"
                    ? "DB 샘플 데이터 기준 오답입니다. 채점 서버 결과로 교체할 수 있습니다."
                    : "DB 샘플 데이터 기준 정답입니다.",
            time: "20ms",
            memory: "4020KB",
            output: activeProblem.status === "wrong" ? "Wrong Answer" : "Accepted",
            logs: [
                `[submit] test=${test.id}`,
                `[submit] problem=${activeProblem.id}`,
                `[submit] language=${language}`,
                "[submit] queued",
                "[submit] judged"
            ]
        });
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <TestHeader test={test} activeProblem={activeProblem} onSubmit={handleSubmit} />

            {message && (
                <div className="mx-auto max-w-[1920px] px-4 pt-4 xl:px-6">
                    <Notice variant="success" title="알림">
                        {message}
                    </Notice>
                </div>
            )}

            <div className="mx-auto grid max-w-[1600px] gap-4 p-4 xl:grid-cols-[260px_minmax(360px,0.9fr)_minmax(520px,1.1fr)] xl:p-6">
                <aside className="space-y-4">
                    <Card className="p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-black text-slate-400">Test Progress</p>
                                <h2 className="mt-1 font-black text-slate-950">문제 목록</h2>
                            </div>

                            <Badge variant="blue">
                                {solvedCount}/{test.problems.length}
                            </Badge>
                        </div>

                        <ProgressBar value={progress} />

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <MiniStat label="점수" value={`${problemScore}`} />
                            <MiniStat label="남은 시간" value={formatTime(test.remainingSeconds)} />
                        </div>
                    </Card>

                    <div className="space-y-2">
                        {test.problems.map((problem) => (
                            <ProblemListItem
                                key={problem.id}
                                problem={problem}
                                active={problem.id === activeProblem.id}
                                onClick={() => handleSelectProblem(problem.id)}
                            />
                        ))}
                    </div>

                    <Card className="p-4">
                        <div className="mb-3 flex items-center gap-2 font-black text-slate-950">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            시험 팁
                        </div>

                        <p className="text-sm leading-7 text-slate-500">
                            쉬운 문제를 먼저 확정하고, 남은 시간에는 오답 문제보다 미해결 문제를 우선 확인하는 것이 좋습니다.
                        </p>
                    </Card>
                </aside>

                <ProblemPanel
                    problem={activeProblem}
                    activeTab={problemTab}
                    setActiveTab={setProblemTab}
                    onUseExample={handleUseExample}
                />

                <section className="space-y-4">
                    <EditorPanel
                        language={language}
                        setLanguage={setLanguage}
                        code={currentCode}
                        setCode={setCurrentCode}
                        activeProblem={activeProblem}
                        onCopy={handleCopyCode}
                        onReset={handleResetCode}
                    />

                    <ConsolePanel
                        activeTab={consoleTab}
                        setActiveTab={setConsoleTab}
                        customInput={customInput}
                        setCustomInput={setCustomInput}
                        result={result}
                        onRun={handleRun}
                        onSubmit={handleSubmit}
                    />
                </section>
            </div>
        </main>
    );
}
