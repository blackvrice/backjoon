"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
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
    id: number;
    order: number;
    title: string;
    difficulty: Difficulty;
    status: ProblemStatus;
    points: number;
    estimatedMinutes: number;
    timeLimit: string;
    memoryLimit: string;
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

const TESTS: TestDetail[] = [
    {
        id: "coding-test-practice-1",
        title: "실전 코딩테스트 1회차",
        description: "구현, 자료구조, 탐색, DP를 섞어 제한 시간 안에 푸는 실전형 모의 테스트입니다.",
        status: "open",
        durationMinutes: 120,
        remainingSeconds: 4380,
        totalScore: 500,
        currentScore: 210,
        startedAtText: "2026.05.03 09:00",
        endAtText: "2026.05.10 23:59",
        problems: [
            {
                id: 1000,
                order: 1,
                title: "두 수의 합",
                difficulty: "Easy",
                status: "solved",
                points: 80,
                estimatedMinutes: 10,
                timeLimit: "1초",
                memoryLimit: "256MB",
                solvedRate: 69.5,
                tags: ["implementation", "math", "입출력"],
                description: "두 정수 A와 B가 주어졌을 때, A+B를 출력하세요.",
                inputDescription: "첫째 줄에 A와 B가 주어집니다.",
                outputDescription: "첫째 줄에 A+B를 출력합니다.",
                constraints: ["0 < A, B < 10"],
                notes: [
                    "기본 입출력 확인용 문제입니다.",
                    "공백으로 구분된 두 정수를 읽으면 됩니다."
                ],
                examples: [
                    {
                        input: "1 2",
                        output: "3"
                    }
                ],
                defaultCodes: createDefaultCodes("두 수의 합")
            },
            {
                id: 10828,
                order: 2,
                title: "스택 명령 처리",
                difficulty: "Medium",
                status: "solved",
                points: 100,
                estimatedMinutes: 20,
                timeLimit: "2초",
                memoryLimit: "512MB",
                solvedRate: 60.5,
                tags: ["stack", "data-structure", "자료구조"],
                description: "정수를 저장하는 스택을 구현한 다음, 입력으로 주어지는 명령을 처리하세요.",
                inputDescription: "첫째 줄에 명령의 수 N이 주어집니다. 다음 N개의 줄에는 명령이 하나씩 주어집니다.",
                outputDescription: "출력을 요구하는 명령마다 한 줄에 하나씩 결과를 출력합니다.",
                constraints: [
                    "1 ≤ N ≤ 10,000",
                    "push X에서 X는 1 이상 100,000 이하입니다."
                ],
                notes: [
                    "C++은 ios::sync_with_stdio(false)를 권장합니다.",
                    "Java는 BufferedReader와 StringBuilder 사용이 좋습니다."
                ],
                examples: [
                    {
                        input: "7\npop\ntop\npush 123\ntop\npop\ntop\npop",
                        output: "-1\n-1\n123\n123\n-1\n-1"
                    }
                ],
                defaultCodes: createDefaultCodes("스택 명령 처리")
            },
            {
                id: 7576,
                order: 3,
                title: "토마토",
                difficulty: "Medium",
                status: "wrong",
                points: 120,
                estimatedMinutes: 30,
                timeLimit: "1초",
                memoryLimit: "256MB",
                solvedRate: 45.8,
                tags: ["bfs", "queue", "graph"],
                description: "보관된 토마토들이 며칠이 지나면 모두 익게 되는지 최소 일수를 구하세요. 익은 토마토는 하루가 지나면 인접한 익지 않은 토마토를 익게 합니다.",
                inputDescription: "첫째 줄에 상자의 가로 칸 수 M과 세로 칸 수 N이 주어집니다. 다음 N개의 줄에는 상자의 상태가 주어집니다.",
                outputDescription: "토마토가 모두 익을 때까지의 최소 날짜를 출력합니다. 모두 익지 못하면 -1을 출력합니다.",
                constraints: [
                    "2 ≤ M, N ≤ 1,000",
                    "1은 익은 토마토, 0은 익지 않은 토마토, -1은 빈 칸입니다."
                ],
                notes: [
                    "다중 시작점 BFS입니다.",
                    "모든 익은 토마토를 큐에 먼저 넣고 시작해야 합니다.",
                    "마지막에 0이 남아 있는지 검사해야 합니다."
                ],
                examples: [
                    {
                        input: "6 4\n0 0 0 0 0 0\n0 0 0 0 0 0\n0 0 0 0 0 0\n0 0 0 0 0 1",
                        output: "8"
                    }
                ],
                defaultCodes: createDefaultCodes("토마토")
            },
            {
                id: 12865,
                order: 4,
                title: "평범한 배낭",
                difficulty: "Hard",
                status: "wrong",
                points: 120,
                estimatedMinutes: 40,
                timeLimit: "2초",
                memoryLimit: "512MB",
                solvedRate: 38.1,
                tags: ["dp", "knapsack"],
                description: "무게와 가치가 있는 물건들이 있을 때, 최대 K만큼의 무게만 넣을 수 있는 배낭에 넣을 수 있는 물건 가치의 최댓값을 구하세요.",
                inputDescription: "첫째 줄에 물품의 수 N과 버틸 수 있는 무게 K가 주어집니다. 다음 N개의 줄에는 각 물건의 무게 W와 가치 V가 주어집니다.",
                outputDescription: "배낭에 넣을 수 있는 물건들의 가치합의 최댓값을 출력합니다.",
                constraints: [
                    "1 ≤ N ≤ 100",
                    "1 ≤ K ≤ 100,000",
                    "1 ≤ W ≤ 100,000",
                    "0 ≤ V ≤ 1,000"
                ],
                notes: [
                    "0/1 배낭 문제입니다.",
                    "1차원 DP는 무게를 뒤에서 앞으로 갱신해야 같은 물건을 중복 선택하지 않습니다."
                ],
                examples: [
                    {
                        input: "4 7\n6 13\n4 8\n3 6\n5 12",
                        output: "14"
                    }
                ],
                defaultCodes: createDefaultCodes("평범한 배낭")
            },
            {
                id: 2178,
                order: 5,
                title: "미로 탐색",
                difficulty: "Medium",
                status: "todo",
                points: 80,
                estimatedMinutes: 20,
                timeLimit: "1초",
                memoryLimit: "256MB",
                solvedRate: 44.7,
                tags: ["bfs", "graph", "grid"],
                description: "N×M 크기의 미로에서 1은 이동할 수 있는 칸, 0은 이동할 수 없는 칸입니다. (1,1)에서 (N,M)까지 이동하는 최소 칸 수를 구하세요.",
                inputDescription: "첫째 줄에 N과 M이 주어지고, 다음 N개의 줄에는 미로가 주어집니다.",
                outputDescription: "지나야 하는 최소 칸 수를 출력합니다.",
                constraints: [
                    "2 ≤ N, M ≤ 100",
                    "항상 도착 위치로 이동할 수 있는 경우만 주어집니다."
                ],
                notes: [
                    "격자 BFS의 기본 문제입니다.",
                    "거리 배열을 별도로 두거나 방문 배열에 거리를 저장할 수 있습니다."
                ],
                examples: [
                    {
                        input: "4 6\n101111\n101010\n101011\n111011",
                        output: "15"
                    }
                ],
                defaultCodes: createDefaultCodes("미로 탐색")
            }
        ]
    }
];

const idleResult: RunResult = {
    status: "idle",
    title: "아직 실행하지 않았습니다.",
    message: "코드를 작성한 뒤 예제 실행 또는 제출을 눌러주세요.",
    time: "-",
    memory: "-",
    output: "",
    logs: ["Ready"]
};

function getTest(id: string) {
    return TESTS.find((test) => test.id === id);
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
                            description="현재는 mock 실행입니다. 실제 구현에서는 /api/judge/run으로 코드를 전송하면 됩니다."
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
    const test = getTest(id);

    const initialProblem = test ? getNextUnsolvedProblem(test) : undefined;

    const [activeProblemId, setActiveProblemId] = useState(initialProblem?.id ?? 0);
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

    const [codes, setCodes] = useState<Record<number, Record<Language, string>>>(() => {
        if (!test) return {};

        return Object.fromEntries(
            test.problems.map((problem) => [problem.id, problem.defaultCodes])
        ) as Record<number, Record<Language, string>>;
    });

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

    const handleRun = () => {
        setConsoleTab("result");

        setResult({
            status: "accepted",
            title: "예제 실행 완료",
            message: "mock 실행 결과입니다. 실제 구현 시 judge API와 연결하세요.",
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

    const handleSubmit = () => {
        setConsoleTab("result");

        setResult({
            status: activeProblem.status === "wrong" ? "wrong" : "accepted",
            title: activeProblem.status === "wrong" ? "제출 결과: 오답" : "제출 결과: 맞았습니다",
            message:
                activeProblem.status === "wrong"
                    ? "샘플 데이터 기준 mock 오답입니다. 실제 구현 시 채점 서버 결과로 교체하세요."
                    : "샘플 데이터 기준 mock 정답입니다.",
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