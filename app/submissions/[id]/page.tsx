"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    MiniStat,
    Notice,
    PageHero,
    ProgressBar,
    SidePanel,
    StatCard
} from "@/components/ui";
import {
    SubmissionStatusBadge,
    type SubmissionStatus
} from "@/components/domain";
import JudgeMonacoEditor from "@/components/editor/JudgeMonacoEditor";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Copy,
    FileCode2,
    Gauge,
    History,
    ListChecks,
    MemoryStick,
    NotebookPen,
    Play,
    Search,
    Sparkles,
    Terminal,
    Timer,
    UserRound,
    XCircle,
    Zap
} from "lucide-react";
import { toSubmissionStatus } from "@/components/domain/SubmissionStatusBadge";

type Language =
    | "C++17"
    | "Python 3.12"
    | "Java 17"
    | "JavaScript"
    | "Dart"
    | "C# 12"
    | "C11";

type DetailTab = "overview" | "code" | "cases" | "log";

type CaseResult = {
    id: string;
    name: string;
    status: SubmissionStatus;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    time: string;
    memory: string;
    message: string;
};

type SubmissionDetail = {
    id: number;
    problemId: number;
    problemDbId: number;
    problemTitle: string;
    status: SubmissionStatus;
    language: Language;
    user: string;
    timeMs: number | null;
    memoryKb: number | null;
    codeLength: number;
    submittedAt: string;
    submittedAtText: string;
    note: string;
    tags: string[];
    compileCommand: string;
    runCommand: string;
    sourceFile: string;
    code: string;
    compileLog: string;
    judgeLog: string[];
    cases: CaseResult[];
};

type ApiProblem = {
    id?: number;
    number?: number;
    title?: string | null;
    tags?: string[] | null;
};

type ApiCaseResult = {
    id?: number | string;
    name?: string | null;
    label?: string | null;
    status?: string | null;
    input?: string | null;
    expectedOutput?: string | null;
    actualOutput?: string | null;
    time?: string | null;
    timeMs?: number | null;
    executionTimeMs?: number | null;
    memory?: string | null;
    memoryKb?: number | null;
    message?: string | null;
    resultMessage?: string | null;
};

type ApiSubmissionDetail = {
    id?: number;
    problemId?: number;
    problemNumber?: number;
    problemTitle?: string | null;
    problem?: ApiProblem | null;
    status?: string | null;
    language?: string | null;
    user?: string | null;
    userName?: string | null;
    userHandle?: string | null;
    timeMs?: number | null;
    executionTimeMs?: number | null;
    memoryKb?: number | null;
    codeLength?: number | string | null;
    submittedAt?: string | Date | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    note?: string | null;
    resultMessage?: string | null;
    tags?: string[] | null;
    compileCommand?: string | null;
    runCommand?: string | null;
    sourceFile?: string | null;
    code?: string | null;
    sourceCode?: string | null;
    compileLog?: string | null;
    judgeLog?: string[] | string | null;
    cases?: ApiCaseResult[] | null;
    testResults?: ApiCaseResult[] | null;
};

type SubmissionDetailApiResponse = {
    ok: boolean;
    message?: string;
    submission?: ApiSubmissionDetail;
};

const tabLabels: Record<DetailTab, string> = {
    overview: "요약",
    code: "코드",
    cases: "테스트 결과",
    log: "채점 로그"
};

const monacoLanguageMap: Record<Language, string> = {
    C11: "c",
    "C++17": "cpp",
    "Python 3.12": "python",
    "Java 17": "java",
    JavaScript: "javascript",
    Dart: "dart",
    "C# 12": "csharp"
};

function normalizeSubmissionStatus(value: unknown): SubmissionStatus {
    const text = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    switch (text) {
        case "accepted":
        case "ac":
        case "success":
            return "accepted";

        case "wrong":
        case "wronganswer":
        case "wa":
            return "wrong";

        case "compile":
        case "compileerror":
        case "ce":
            return "compile";

        case "runtime":
        case "runtimeerror":
        case "re":
            return "runtime";

        case "timelimit":
        case "tle":
        case "timeout":
        case "memorylimit":
        case "mle":
            return "timeLimit";

        case "judging":
        case "running":
            return "judging";

        case "pending":
        case "queued":
        default:
            return "pending";
    }
}

function normalizeLanguage(value: unknown): Language {
    const text = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    switch (text) {
        case "c":
        case "c11":
        case "gcc":
            return "C11";

        case "cpp":
        case "c++":
        case "cpp17":
        case "c++17":
        case "cplusplus":
        case "g++":
            return "C++17";

        case "python":
        case "python3":
        case "python3.12":
        case "py":
            return "Python 3.12";

        case "java":
        case "java17":
        case "java21":
            return "Java 17";

        case "javascript":
        case "node":
        case "nodejs":
        case "js":
            return "JavaScript";

        case "dart":
            return "Dart";

        case "csharp":
        case "c#":
        case "cs":
        case "dotnet":
            return "C# 12";

        default:
            return "C++17";
    }
}

function formatTime(timeMs: number | null) {
    return timeMs === null ? "-" : `${timeMs}ms`;
}

function formatMemory(memoryKb: number | null) {
    if (memoryKb === null) return "-";
    return `${memoryKb.toLocaleString()}KB`;
}

function formatDateTime(value?: string | Date | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");

    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function toIsoDateString(value?: string | Date | null) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toISOString();
}

function getCodeLength(submission: ApiSubmissionDetail) {
    if (typeof submission.codeLength === "number") {
        return submission.codeLength;
    }

    if (typeof submission.codeLength === "string") {
        const parsed = Number(submission.codeLength.replace(/[^\d]/g, ""));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const code = submission.code ?? submission.sourceCode;

    if (typeof code === "string") {
        return new Blob([code]).size;
    }

    return 0;
}

function normalizeJudgeLog(value: ApiSubmissionDetail["judgeLog"]) {
    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (typeof value === "string" && value.trim()) {
        return value.split(/\r?\n/).filter(Boolean);
    }

    return [];
}

function getDefaultSourceFile(language: Language) {
    switch (language) {
        case "C11":
            return "Main.c";

        case "Python 3.12":
            return "Main.py";

        case "Java 17":
            return "Main.java";

        case "JavaScript":
            return "Main.js";

        case "Dart":
            return "Main.dart";

        case "C# 12":
            return "Program.cs";

        case "C++17":
        default:
            return "Main.cpp";
    }
}

function getDefaultCompileCommand(language: Language) {
    switch (language) {
        case "C11":
            return "gcc Main.c -O2 -std=c11 -Wall -Wextra -o main";

        case "C++17":
            return "g++ Main.cpp -O2 -std=c++17 -Wall -Wextra -pipe -o main";

        case "Java 17":
            return "javac Main.java";

        case "C# 12":
            return "dotnet build Judge.csproj -c Release --nologo -v:q";

        case "Dart":
            return "dart compile exe Main.dart -o main";

        case "Python 3.12":
        case "JavaScript":
        default:
            return "-";
    }
}

function getDefaultRunCommand(language: Language) {
    switch (language) {
        case "C11":
        case "C++17":
        case "Dart":
            return "./main";

        case "Python 3.12":
            return "python3 Main.py";

        case "Java 17":
            return "java Main";

        case "JavaScript":
            return "node Main.js";

        case "C# 12":
            return "dotnet ./bin/Release/net8.0/Judge.dll";

        default:
            return "-";
    }
}

function normalizeCaseFromApi(item: ApiCaseResult, index: number): CaseResult {
    const status = normalizeSubmissionStatus(item.status);
    const timeMs =
        typeof item.timeMs === "number"
            ? item.timeMs
            : typeof item.executionTimeMs === "number"
                ? item.executionTimeMs
                : null;

    return {
        id: String(item.id ?? `case-${index + 1}`),
        name: item.name ?? item.label ?? `테스트 ${index + 1}`,
        status,
        input: item.input ?? "",
        expectedOutput: item.expectedOutput ?? "",
        actualOutput: item.actualOutput ?? "",
        time: item.time ?? formatTime(timeMs),
        memory: item.memory ?? formatMemory(item.memoryKb ?? null),
        message:
            item.message ??
            item.resultMessage ??
            (status === "accepted"
                ? "통과했습니다."
                : status === "wrong"
                    ? "출력이 정답과 다릅니다."
                    : status === "compile"
                        ? "컴파일 오류가 발생했습니다."
                        : status === "runtime"
                            ? "런타임 에러가 발생했습니다."
                            : status === "timeLimit"
                                ? "시간 제한을 초과했습니다."
                                : "채점 결과를 확인하세요.")
    };
}

function normalizeSubmissionFromApi(submission: ApiSubmissionDetail): SubmissionDetail {
    const language = normalizeLanguage(submission.language);
    const problemNumber = Number(
        submission.problemNumber ??
        submission.problem?.number ??
        submission.problemId ??
        0
    );
    const problemDbId = Number(submission.problem?.id ?? submission.problemId ?? 0);
    const submittedAtSource =
        submission.submittedAt ??
        submission.createdAt ??
        submission.updatedAt ??
        null;

    const code = submission.code ?? submission.sourceCode ?? "";
    const casesSource = submission.cases ?? submission.testResults ?? [];
    const cases = Array.isArray(casesSource)
        ? casesSource.map(normalizeCaseFromApi)
        : [];

    const status = normalizeSubmissionStatus(submission.status);

    return {
        id: Number(submission.id ?? 0),
        problemId: problemNumber,
        problemDbId,
        problemTitle:
            submission.problemTitle ??
            submission.problem?.title ??
            `문제 #${problemNumber}`,
        status,
        language,
        user:
            submission.userName ??
            submission.userHandle ??
            submission.user ??
            "local",
        timeMs:
            typeof submission.timeMs === "number"
                ? submission.timeMs
                : typeof submission.executionTimeMs === "number"
                    ? submission.executionTimeMs
                    : null,
        memoryKb:
            typeof submission.memoryKb === "number"
                ? submission.memoryKb
                : null,
        codeLength: getCodeLength(submission),
        submittedAt: toIsoDateString(submittedAtSource),
        submittedAtText: formatDateTime(submittedAtSource),
        note:
            submission.note ??
            submission.resultMessage ??
            (status === "accepted"
                ? "정답입니다."
                : "제출 결과 상세를 확인하세요."),
        tags:
            Array.isArray(submission.tags)
                ? submission.tags
                : Array.isArray(submission.problem?.tags)
                    ? submission.problem.tags
                    : [],
        compileCommand:
            submission.compileCommand ??
            getDefaultCompileCommand(language),
        runCommand:
            submission.runCommand ??
            getDefaultRunCommand(language),
        sourceFile:
            submission.sourceFile ??
            getDefaultSourceFile(language),
        code,
        compileLog:
            submission.compileLog ??
            (status === "compile"
                ? "컴파일 오류가 발생했습니다."
                : status === "pending" || status === "judging"
                    ? "아직 컴파일 로그가 없습니다."
                    : "Compilation completed successfully."),
        judgeLog: normalizeJudgeLog(submission.judgeLog),
        cases
    };
}

async function fetchSubmissionDetail(id: string): Promise<SubmissionDetail> {
    const response = await fetch(`/api/submissions/${id}`, {
        method: "GET",
        cache: "no-store"
    });

    const data = (await response.json()) as SubmissionDetailApiResponse;

    if (!response.ok || !data.ok || !data.submission) {
        throw new Error(data.message ?? "제출 기록을 불러오지 못했습니다.");
    }

    return normalizeSubmissionFromApi(data.submission);
}

function getStatusTone(status: SubmissionStatus) {
    switch (status) {
        case "accepted":
            return "green" as const;

        case "wrong":
        case "compile":
        case "runtime":
        case "timeLimit":
            return "red" as const;

        case "pending":
        case "judging":
            return "orange" as const;

        default:
            return "blue" as const;
    }
}

function getStatusShortText(status: SubmissionStatus) {
    switch (status) {
        case "accepted":
            return "AC";

        case "wrong":
            return "WA";

        case "compile":
            return "CE";

        case "runtime":
            return "RE";

        case "timeLimit":
            return "TLE";

        case "pending":
            return "PENDING";

        case "judging":
            return "JUDGING";

        default:
            return status;
    }
}

function getStatusText(status: SubmissionStatus) {
    switch (status) {
        case "accepted":
            return "맞았습니다";

        case "wrong":
            return "틀렸습니다";

        case "compile":
            return "컴파일 에러";

        case "runtime":
            return "런타임 에러";

        case "timeLimit":
            return "시간 초과";

        case "pending":
            return "채점 대기";

        case "judging":
            return "채점 중";

        default:
            return status;
    }
}

function getStatusNotice(submission: SubmissionDetail) {
    switch (submission.status) {
        case "accepted":
            return {
                variant: "success" as const,
                title: "맞았습니다",
                message: "모든 테스트 케이스를 통과했습니다."
            };

        case "wrong":
            return {
                variant: "danger" as const,
                title: "틀렸습니다",
                message: submission.note || "출력이 정답과 다른 테스트 케이스가 있습니다."
            };

        case "compile":
            return {
                variant: "danger" as const,
                title: "컴파일 에러",
                message: submission.compileLog || "컴파일 또는 문법 검사 단계에서 실패했습니다."
            };

        case "runtime":
            return {
                variant: "danger" as const,
                title: "런타임 에러",
                message: submission.note || "실행 중 예외 또는 비정상 종료가 발생했습니다."
            };

        case "timeLimit":
            return {
                variant: "warning" as const,
                title: "시간 초과",
                message: "제한 시간 안에 실행이 완료되지 않았습니다."
            };

        case "pending":
        case "judging":
            return {
                variant: "info" as const,
                title: "채점 진행 중",
                message: "채점이 아직 완료되지 않았습니다."
            };

        default:
            return {
                variant: "info" as const,
                title: "제출 상태",
                message: "제출 상태를 확인하세요."
            };
    }
}

function TabButton({
                       tab,
                       activeTab,
                       onClick
                   }: {
    tab: DetailTab;
    activeTab: DetailTab;
    onClick: (tab: DetailTab) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onClick(tab)}
            className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === tab
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
        >
            {tabLabels[tab]}
        </button>
    );
}

function OverviewTab({ submission }: { submission: SubmissionDetail }) {
    const notice = getStatusNotice(submission);
    const acceptedCases = submission.cases.filter((item) => item.status === "accepted").length;
    const caseProgress = Math.round((acceptedCases / Math.max(submission.cases.length, 1)) * 100);

    return (
        <div className="space-y-4">
            <Notice variant={notice.variant} title={notice.title}>
                {notice.message}
            </Notice>

            <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-950">제출 정보</h3>
                    <SubmissionStatusBadge value={submission.status} />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <InfoBox label="제출 번호" value={`#${submission.id}`} icon={History} />
                    <InfoBox
                        label="문제"
                        value={`${submission.problemId}. ${submission.problemTitle}`}
                        icon={BookOpen}
                        href={`/problems/${submission.problemId}`}
                    />
                    <InfoBox label="언어" value={submission.language} icon={Code2} />
                    <InfoBox label="실행 시간" value={formatTime(submission.timeMs)} icon={Timer} />
                    <InfoBox label="메모리" value={formatMemory(submission.memoryKb)} icon={MemoryStick} />
                    <InfoBox label="코드 길이" value={`${submission.codeLength.toLocaleString()}B`} icon={FileCode2} />
                    <InfoBox label="제출자" value={submission.user} icon={UserRound} />
                    <InfoBox label="제출 시간" value={submission.submittedAtText} icon={Clock3} />
                    <InfoBox label="파일" value={submission.sourceFile} icon={Terminal} />
                </div>
            </Card>

            <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-950">테스트 통과율</h3>
                    <span className="text-sm font-black text-blue-600">{caseProgress}%</span>
                </div>

                <ProgressBar
                    value={caseProgress}
                    barClassName={caseProgress === 100 ? "bg-emerald-600" : "bg-orange-500"}
                />

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <MiniStat label="전체" value={`${submission.cases.length}`} />
                    <MiniStat label="통과" value={`${acceptedCases}`} />
                    <MiniStat label="실패" value={`${submission.cases.length - acceptedCases}`} />
                </div>
            </Card>

            <Card className="p-5">
                <h3 className="text-xl font-black text-slate-950">메모</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                    {submission.note}
                </p>

                {submission.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {submission.tags.map((tag) => (
                            <Badge key={tag}>#{tag}</Badge>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

function InfoBox({
                     label,
                     value,
                     icon: Icon,
                     href
                 }: {
    label: string;
    value: string;
    icon: ComponentType<{ className?: string }>;
    href?: string;
}) {
    const content = (
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-black text-slate-400">{label}</p>
                <p className="mt-1 break-all text-sm font-black text-slate-800">{value}</p>
            </div>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function CodeTab({
                     submission,
                     onCopy
                 }: {
    submission: SubmissionDetail;
    onCopy: () => void;
}) {
    return (
        <Card className="relative z-10 overflow-visible">
            <div className="flex flex-col gap-3 rounded-t-3xl border-b border-slate-100 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="blue">{submission.language}</Badge>
                    <Badge>{submission.sourceFile}</Badge>
                    <Badge>{submission.codeLength.toLocaleString()}B</Badge>
                    <Badge>Read Only</Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Copy} onClick={onCopy}>
                        코드 복사
                    </AppButton>

                    <AppLinkButton
                        href={`/problems/${submission.problemId}/solve`}
                        variant="primary"
                        iconRight={ArrowRight}
                    >
                        이 코드로 다시 풀기
                    </AppLinkButton>
                </div>
            </div>

            <div className="relative min-h-[720px] overflow-visible rounded-b-3xl bg-slate-950">
                <JudgeMonacoEditor
                    key={`${submission.id}-${submission.language}`}
                    height="720px"
                    theme="vs-dark"
                    language={monacoLanguageMap[submission.language]}
                    judgeLanguage={submission.language}
                    fileName={submission.sourceFile}
                    value={submission.code}
                    onChange={() => {
                        // 제출 상세 화면은 읽기 전용입니다.
                    }}
                    readOnly
                    enableLsp={false}
                    options={{
                        domReadOnly: true,
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

function CasesTab({ cases }: { cases: CaseResult[] }) {
    if (cases.length === 0) {
        return (
            <EmptyState
                title="테스트 결과가 없습니다."
                description="아직 저장된 테스트 케이스별 실행 결과가 없습니다."
                icon={ListChecks}
            />
        );
    }

    return (
        <div className="space-y-4">
            {cases.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <SubmissionStatusBadge value={item.status} />
                            <span className="font-black text-slate-950">{item.name}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-black text-slate-400">
                            <Badge>{item.time}</Badge>
                            <Badge>{item.memory}</Badge>
                        </div>
                    </div>

                    <div className="grid gap-0 xl:grid-cols-3">
                        <CaseBlock title="입력" value={item.input || "-"} />
                        <CaseBlock title="기대 출력" value={item.expectedOutput || "-"} />
                        <CaseBlock title="실제 출력" value={item.actualOutput || "-"} />
                    </div>

                    <div className="border-t border-slate-100 p-5">
                        <p className="text-sm leading-7 text-slate-500">{item.message}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function CaseBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="border-b border-slate-100 p-5 xl:border-b-0 xl:border-r last:xl:border-r-0">
            <h4 className="mb-3 font-black text-slate-950">{title}</h4>
            <pre className="max-h-60 overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                <code>{value}</code>
            </pre>
        </div>
    );
}

function LogTab({ submission }: { submission: SubmissionDetail }) {
    return (
        <div className="space-y-4">
            <Card className="p-5">
                <h3 className="text-xl font-black text-slate-950">컴파일 로그</h3>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                    <code>{submission.compileLog || "-"}</code>
                </pre>
            </Card>

            <Card className="p-5">
                <h3 className="text-xl font-black text-slate-950">채점 로그</h3>

                {submission.judgeLog.length === 0 ? (
                    <p className="mt-4 text-sm font-bold text-slate-500">
                        저장된 채점 로그가 없습니다.
                    </p>
                ) : (
                    <div className="mt-4 space-y-2">
                        {submission.judgeLog.map((line, index) => (
                            <div
                                key={`${line}-${index}`}
                                className="rounded-2xl bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-600"
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="p-5">
                <h3 className="text-xl font-black text-slate-950">실행 명령</h3>
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    <CommandBox label="Compile" value={submission.compileCommand} />
                    <CommandBox label="Run" value={submission.runCommand} />
                </div>
            </Card>
        </div>
    );
}

function CommandBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-400">{label}</p>
            <pre className="mt-2 overflow-x-auto font-mono text-sm font-bold text-slate-700">
                <code>{value || "-"}</code>
            </pre>
        </div>
    );
}

function ResultTimeline({ submission }: { submission: SubmissionDetail }) {
    const steps = [
        {
            label: "제출 접수",
            done: true,
            icon: History
        },
        {
            label: "컴파일",
            done: submission.status !== "pending" && submission.status !== "judging",
            icon: Terminal
        },
        {
            label: "테스트 실행",
            done:
                submission.status !== "compile" &&
                submission.status !== "pending" &&
                submission.status !== "judging",
            icon: Play
        },
        {
            label: "결과 확정",
            done: submission.status !== "pending" && submission.status !== "judging",
            icon: submission.status === "accepted" ? CheckCircle2 : XCircle
        }
    ];

    return (
        <SidePanel title="채점 단계" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                        <div
                            key={step.label}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                        >
                            <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                    step.done ? "bg-blue-600 text-white" : "bg-white text-slate-400"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </div>

                            <div>
                                <p className="text-sm font-black text-slate-800">
                                    {index + 1}. {step.label}
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-slate-400">
                                    {step.done ? "완료" : "대기"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SidePanel>
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

function NotFoundSubmission({
                                id,
                                message
                            }: {
    id: string;
    message?: string;
}) {
    return (
        <AppShell
            title="제출을 찾을 수 없습니다"
            description="요청한 제출 기록이 DB에 없습니다."
        >
            <EmptyState
                title={`#${id} 제출을 찾을 수 없습니다.`}
                description={message ?? "제출 번호를 다시 확인하거나 전체 제출 기록으로 돌아가세요."}
                icon={Search}
                action={
                    <AppLinkButton href="/submissions" variant="dark" icon={ArrowLeft}>
                        제출 기록으로 돌아가기
                    </AppLinkButton>
                }
            />
        </AppShell>
    );
}

function LoadingSubmission() {
    return (
        <AppShell
            title="제출 기록을 불러오는 중입니다"
            description="DB에서 제출 상세 정보를 가져오고 있습니다."
        >
            <Card className="p-6">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <ListChecks className="h-5 w-5" />
                    제출 상세 정보를 불러오는 중입니다.
                </div>
            </Card>
        </AppShell>
    );
}

function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold">
            <span className="text-slate-400">{label}</span>
            <span className="break-all text-right text-slate-700">{value}</span>
        </div>
    );
}

export default function SubmissionDetailPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");

    const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>("overview");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        async function loadSubmission() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const nextSubmission = await fetchSubmissionDetail(id);

                if (!alive) return;

                setSubmission(nextSubmission);
                setActiveTab("overview");
            } catch (error) {
                if (!alive) return;

                setSubmission(null);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "제출 기록을 불러오지 못했습니다."
                );
            } finally {
                if (alive) {
                    setIsLoading(false);
                }
            }
        }

        if (id) {
            void loadSubmission();
        }

        return () => {
            alive = false;
        };
    }, [id]);

    const acceptedCases = useMemo(() => {
        if (!submission) return 0;
        return submission.cases.filter((item) => item.status === "accepted").length;
    }, [submission]);

    if (isLoading) {
        return <LoadingSubmission />;
    }

    if (errorMessage || !submission) {
        return <NotFoundSubmission id={id} message={errorMessage ?? undefined} />;
    }

    const caseProgress = Math.round((acceptedCases / Math.max(submission.cases.length, 1)) * 100);
    const statusTone = getStatusTone(submission.status);

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(submission.code);
        setMessage("코드를 클립보드에 복사했습니다.");
        window.setTimeout(() => setMessage(null), 1800);
    };

    return (
        <AppShell
            title={`제출 #${submission.id}`}
            description={`${submission.problemTitle} · ${submission.language} · ${submission.submittedAtText}`}
        >
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link
                                href="/submissions"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                제출 기록
                            </Link>

                            <Badge variant="blue">Submission</Badge>
                            <SubmissionStatusBadge value={submission.status} />
                            <Badge>{submission.language}</Badge>
                        </>
                    }
                    title={`제출 #${submission.id}`}
                    description={`${submission.problemId}. ${submission.problemTitle} · ${submission.note}`}
                    icon={ListChecks}
                    rightTitle="결과"
                    rightValue={getStatusShortText(submission.status)}
                    rightCaption={`${formatTime(submission.timeMs)} · ${formatMemory(submission.memoryKb)}`}
                    metrics={[
                        {
                            label: "문제",
                            value: `#${submission.problemId}`
                        },
                        {
                            label: "언어",
                            value: submission.language
                        },
                        {
                            label: "테스트",
                            value: `${acceptedCases}/${submission.cases.length}`
                        }
                    ]}
                    actions={
                        <>
                            <AppLinkButton
                                href={`/problems/${submission.problemId}/solve`}
                                variant="primary"
                                size="lg"
                                iconRight={ArrowRight}
                            >
                                다시 풀기
                            </AppLinkButton>

                            <AppLinkButton
                                href={`/problems/${submission.problemId}`}
                                variant="white"
                                size="lg"
                                icon={BookOpen}
                            >
                                문제 보기
                            </AppLinkButton>
                        </>
                    }
                />

                {message && (
                    <Notice variant="success" title="알림">
                        {message}
                    </Notice>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="결과"
                        value={getStatusText(submission.status)}
                        caption="채점 결과"
                        icon={submission.status === "accepted" ? CheckCircle2 : XCircle}
                        tone={statusTone}
                    />

                    <StatCard
                        label="실행 시간"
                        value={formatTime(submission.timeMs)}
                        caption="최대 실행 시간"
                        icon={Timer}
                        tone="blue"
                    />

                    <StatCard
                        label="메모리"
                        value={formatMemory(submission.memoryKb)}
                        caption="최대 사용 메모리"
                        icon={MemoryStick}
                        tone="orange"
                    />

                    <StatCard
                        label="코드 길이"
                        value={`${submission.codeLength.toLocaleString()}B`}
                        caption={submission.sourceFile}
                        icon={FileCode2}
                    />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(["overview", "code", "cases", "log"] as DetailTab[]).map((tab) => (
                                    <TabButton
                                        key={tab}
                                        tab={tab}
                                        activeTab={activeTab}
                                        onClick={setActiveTab}
                                    />
                                ))}
                            </div>
                        </Card>

                        {activeTab === "overview" && <OverviewTab submission={submission} />}

                        {activeTab === "code" && (
                            <CodeTab submission={submission} onCopy={handleCopyCode} />
                        )}

                        {activeTab === "cases" && <CasesTab cases={submission.cases} />}

                        {activeTab === "log" && <LogTab submission={submission} />}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="결과 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">테스트 통과율</p>
                                <p className="mt-1 text-5xl font-black">{caseProgress}%</p>
                                <ProgressBar
                                    value={caseProgress}
                                    className="mt-5 bg-white/10"
                                    barClassName={caseProgress === 100 ? "bg-emerald-500" : "bg-orange-500"}
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="전체" value={`${submission.cases.length}`} />
                                <MiniStat label="통과" value={`${acceptedCases}`} />
                                <MiniStat label="실패" value={`${submission.cases.length - acceptedCases}`} />
                            </div>
                        </SidePanel>

                        <ResultTimeline submission={submission} />

                        <SidePanel title="문제 정보" badge={<BookOpen className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <InfoLine
                                    label="문제"
                                    value={`${submission.problemId}. ${submission.problemTitle}`}
                                />
                                <InfoLine label="제출자" value={submission.user} />
                                <InfoLine label="제출 시간" value={submission.submittedAtText} />
                                <InfoLine label="언어" value={submission.language} />
                            </div>

                            {submission.tags.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {submission.tags.map((tag) => (
                                        <Badge key={tag}>#{tag}</Badge>
                                    ))}
                                </div>
                            )}
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink
                                    href={`/problems/${submission.problemId}`}
                                    label="문제 상세"
                                    icon={BookOpen}
                                />
                                <QuickLink
                                    href={`/problems/${submission.problemId}/solve`}
                                    label="다시 풀기"
                                    icon={Play}
                                />
                                <QuickLink
                                    href={`/problems/${submission.problemId}/submissions`}
                                    label="이 문제 제출 기록"
                                    icon={History}
                                />
                                <QuickLink href="/submissions" label="전체 제출 기록" icon={ListChecks} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/submissions/[id]`는 `GET /api/submissions/[id]`
                            응답을 기준으로 제출 상세, 코드, 테스트 결과, 로그를 렌더링합니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}