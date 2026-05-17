"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import {
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
    FilterPanel,
    FilterSelect,
    SearchInput
} from "@/components/forms";
import {
    ListHeader,
    ViewModeToggle,
    type ViewMode
} from "@/components/common";
import {
    SubmissionStatusBadge,
    type SubmissionStatus
} from "@/components/domain";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Database,
    FileCode2,
    Gauge,
    History,
    ListChecks,
    NotebookPen,
    RotateCcw,
    Search,
    Sparkles,
    Target,
    Timer,
    Trophy,
    XCircle
} from "lucide-react";

type StatusFilter =
    | "전체"
    | "맞았습니다"
    | "틀렸습니다"
    | "시간 초과"
    | "런타임 에러"
    | "컴파일 에러"
    | "채점 대기"
    | "채점 중";

type LanguageFilter = string;

type SortOption =
    | "recent"
    | "oldest"
    | "time-asc"
    | "memory-asc"
    | "code-length-desc"
    | "problem-asc";

type SubmissionItem = {
    id: number;
    problemId: number;
    problemTitle: string;
    status: SubmissionStatus;
    language: string;
    timeMs: number | null;
    memoryKb: number | null;
    codeLength: number;
    submittedAt: string;
    submittedAtText: string;
    user: string;
    note: string;
    tags: string[];
};

type ApiProblem = {
    id?: number;
    number?: number;
    title?: string | null;
    tags?: string[] | null;
};

type ApiSubmission = {
    id?: number;
    problemId?: number;
    problemNumber?: number;
    problemTitle?: string | null;
    status?: string | null;
    language?: string | null;
    timeMs?: number | null;
    executionTimeMs?: number | null;
    memoryKb?: number | null;
    codeLength?: number | string | null;
    code?: string | null;
    sourceCode?: string | null;
    submittedAt?: string | Date | null;
    createdAt?: string | Date | null;
    updatedAt?: string | Date | null;
    user?: string | null;
    userName?: string | null;
    userHandle?: string | null;
    note?: string | null;
    resultMessage?: string | null;
    tags?: string[] | null;
    problem?: ApiProblem | null;
};

type SubmissionsApiResponse = {
    ok: boolean;
    message?: string;
    submissions?: ApiSubmission[];
};

const STATUS_OPTIONS: readonly StatusFilter[] = [
    "전체",
    "맞았습니다",
    "틀렸습니다",
    "시간 초과",
    "런타임 에러",
    "컴파일 에러",
    "채점 대기",
    "채점 중"
];

const DEFAULT_LANGUAGE_OPTIONS: readonly LanguageFilter[] = [
    "전체",
    "C++17",
    "Python 3.12",
    "Java 17",
    "JavaScript",
    "Dart",
    "C# 12"
];

const SORT_OPTIONS: readonly SortOption[] = [
    "recent",
    "oldest",
    "time-asc",
    "memory-asc",
    "code-length-desc",
    "problem-asc"
];

const statusLabelToValue: Record<Exclude<StatusFilter, "전체">, SubmissionStatus> = {
    "맞았습니다": "accepted",
    "틀렸습니다": "wrong",
    "시간 초과": "timeLimit",
    "런타임 에러": "runtime",
    "컴파일 에러": "compile",
    "채점 대기": "pending",
    "채점 중": "judging"
};

const sortLabels: Record<SortOption, string> = {
    recent: "최근 제출순",
    oldest: "오래된 제출순",
    "time-asc": "실행 시간 낮은순",
    "memory-asc": "메모리 낮은순",
    "code-length-desc": "코드 길이 긴순",
    "problem-asc": "문제 번호 낮은순"
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

function normalizeLanguage(value: unknown): string {
    const text = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    switch (text) {
        case "cpp":
        case "c++":
        case "c++17":
        case "cpp17":
        case "cplusplus":
            return "C++17";

        case "c":
        case "c11":
            return "C11";

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
            return String(value ?? "-") || "-";
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

function getCodeLength(submission: ApiSubmission) {
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

function normalizeSubmissionFromApi(submission: ApiSubmission): SubmissionItem {
    const problemNumber = Number(
        submission.problemNumber ??
        submission.problem?.number ??
        submission.problemId ??
        0
    );

    const submittedAtSource =
        submission.submittedAt ??
        submission.createdAt ??
        submission.updatedAt ??
        null;

    return {
        id: Number(submission.id ?? 0),
        problemId: problemNumber,
        problemTitle:
            submission.problemTitle ??
            submission.problem?.title ??
            `문제 #${problemNumber}`,
        status: normalizeSubmissionStatus(submission.status),
        language: normalizeLanguage(submission.language),
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
        user:
            submission.userName ??
            submission.userHandle ??
            submission.user ??
            "local",
        note:
            submission.note ??
            submission.resultMessage ??
            "제출 결과 상세를 확인하세요.",
        tags:
            Array.isArray(submission.tags)
                ? submission.tags
                : Array.isArray(submission.problem?.tags)
                    ? submission.problem.tags
                    : []
    };
}

async function fetchSubmissions(): Promise<SubmissionItem[]> {
    const response = await fetch("/api/submissions", {
        method: "GET",
        cache: "no-store"
    });

    const data = (await response.json()) as SubmissionsApiResponse;

    if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "제출 기록을 불러오지 못했습니다.");
    }

    return Array.isArray(data.submissions)
        ? data.submissions.map(normalizeSubmissionFromApi)
        : [];
}

function getAverageTime(items: SubmissionItem[]) {
    const values = items
        .map((item) => item.timeMs)
        .filter((value): value is number => value !== null);

    if (values.length === 0) return 0;

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getAverageMemory(items: SubmissionItem[]) {
    const values = items
        .map((item) => item.memoryKb)
        .filter((value): value is number => value !== null);

    if (values.length === 0) return 0;

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isErrorStatus(status: SubmissionStatus) {
    return status === "compile" || status === "runtime" || status === "timeLimit";
}

function LoadingSubmissionsPage() {
    return (
        <AppShell
            title="제출 기록을 불러오는 중입니다"
            description="DB에서 전체 제출 기록을 가져오고 있습니다."
        >
            <Card className="p-6">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                    <ListChecks className="h-5 w-5" />
                    제출 기록을 불러오는 중입니다.
                </div>
            </Card>
        </AppShell>
    );
}

function SubmissionCard({ submission }: { submission: SubmissionItem }) {
    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <SubmissionStatusBadge value={submission.status} />
                        <Badge variant="blue">{submission.language}</Badge>
                        <Badge>#{submission.id}</Badge>
                    </div>

                    <Link
                        href={`/problems/${submission.problemId}`}
                        className="text-xl font-black text-slate-950 transition hover:text-blue-600"
                    >
                        {submission.problemId}. {submission.problemTitle}
                    </Link>

                    <p className="mt-2 text-sm leading-7 text-slate-500">
                        {submission.note}
                    </p>

                    {submission.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {submission.tags.map((tag) => (
                                <Badge key={tag}>#{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="시간" value={formatTime(submission.timeMs)} />
                    <MetricBox label="메모리" value={formatMemory(submission.memoryKb)} />
                    <MetricBox label="코드" value={`${submission.codeLength.toLocaleString()}B`} />
                    <MetricBox label="제출자" value={submission.user} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Clock3 className="h-4 w-4" />
                    {submission.submittedAtText}
                </div>

                <div className="flex flex-wrap gap-2">
                    <AppLinkButton
                        href={`/submissions/${submission.id}`}
                        variant="secondary"
                        iconRight={ChevronRight}
                    >
                        제출 상세
                    </AppLinkButton>

                    <AppLinkButton
                        href={`/problems/${submission.problemId}/solve`}
                        variant="primary"
                        iconRight={ArrowRight}
                    >
                        다시 풀기
                    </AppLinkButton>
                </div>
            </div>
        </Card>
    );
}

function MetricBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 font-black text-slate-950">{value}</p>
        </div>
    );
}

function SubmissionsTable({ items }: { items: SubmissionItem[] }) {
    return (
        <Card className="overflow-hidden">
            {/* 데스크톱/태블릿용 압축 테이블 */}
            <div className="hidden overflow-hidden md:block">
                <table className="w-full table-fixed text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="w-[38%] px-4 py-4">제출 / 문제</th>
                        <th className="w-[18%] px-4 py-4">결과 / 언어</th>
                        <th className="w-[18%] px-4 py-4">성능</th>
                        <th className="w-[18%] px-4 py-4">제출 정보</th>
                        <th className="w-[8%] px-4 py-4 text-right">상세</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {items.map((submission) => (
                        <tr key={submission.id} className="transition hover:bg-slate-50">
                            <td className="px-4 py-4">
                                <div className="min-w-0">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/submissions/${submission.id}`}
                                            className="font-black text-slate-950 transition hover:text-blue-600"
                                        >
                                            #{submission.id}
                                        </Link>

                                        <span className="text-xs font-bold text-slate-300">·</span>

                                        <Link
                                            href={`/problems/${submission.problemId}`}
                                            className="min-w-0 truncate font-black text-slate-950 transition hover:text-blue-600"
                                        >
                                            {submission.problemId}. {submission.problemTitle}
                                        </Link>
                                    </div>

                                    <p className="line-clamp-1 text-xs font-bold text-slate-400">
                                        {submission.note}
                                    </p>
                                </div>
                            </td>

                            <td className="px-4 py-4">
                                <div className="flex flex-col items-start gap-2">
                                    <SubmissionStatusBadge value={submission.status} />
                                    <Badge variant="blue">{submission.language}</Badge>
                                </div>
                            </td>

                            <td className="px-4 py-4">
                                <div className="grid gap-1 text-xs font-bold text-slate-500">
                                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                        <span className="text-slate-400">시간</span>
                                        <span className="text-slate-700">{formatTime(submission.timeMs)}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                        <span className="text-slate-400">메모리</span>
                                        <span className="text-slate-700">{formatMemory(submission.memoryKb)}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                        <span className="text-slate-400">코드</span>
                                        <span className="text-slate-700">
                                            {submission.codeLength.toLocaleString()}B
                                        </span>
                                    </div>
                                </div>
                            </td>

                            <td className="px-4 py-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-700">
                                        {submission.user}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-slate-400">
                                        {submission.submittedAtText}
                                    </p>
                                </div>
                            </td>

                            <td className="px-4 py-4 text-right">
                                <AppLinkButton
                                    href={`/submissions/${submission.id}`}
                                    size="sm"
                                    iconRight={ChevronRight}
                                >
                                    상세
                                </AppLinkButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* 모바일용 카드형 목록 */}
            <div className="divide-y divide-slate-100 md:hidden">
                {items.map((submission) => (
                    <div key={submission.id} className="p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <SubmissionStatusBadge value={submission.status} />
                            <Badge variant="blue">{submission.language}</Badge>
                            <Badge>#{submission.id}</Badge>
                        </div>

                        <Link
                            href={`/problems/${submission.problemId}`}
                            className="block text-base font-black text-slate-950 transition hover:text-blue-600"
                        >
                            {submission.problemId}. {submission.problemTitle}
                        </Link>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {submission.note}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <MetricBox label="시간" value={formatTime(submission.timeMs)} />
                            <MetricBox label="메모리" value={formatMemory(submission.memoryKb)} />
                            <MetricBox
                                label="코드"
                                value={`${submission.codeLength.toLocaleString()}B`}
                            />
                            <MetricBox label="제출자" value={submission.user} />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Clock3 className="h-4 w-4" />
                                {submission.submittedAtText}
                            </div>

                            <AppLinkButton
                                href={`/submissions/${submission.id}`}
                                size="sm"
                                iconRight={ChevronRight}
                            >
                                상세
                            </AppLinkButton>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function StatusDistributionPanel({ items }: { items: SubmissionItem[] }) {
    const accepted = items.filter((item) => item.status === "accepted").length;
    const wrong = items.filter((item) => item.status === "wrong").length;
    const error = items.filter((item) => isErrorStatus(item.status)).length;
    const pending = items.filter(
        (item) => item.status === "pending" || item.status === "judging"
    ).length;
    const total = Math.max(items.length, 1);

    return (
        <SidePanel title="결과 분포" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                <DistributionRow
                    label="맞았습니다"
                    value={accepted}
                    total={total}
                    barClassName="bg-emerald-600"
                    icon={CheckCircle2}
                />

                <DistributionRow
                    label="틀렸습니다"
                    value={wrong}
                    total={total}
                    barClassName="bg-rose-600"
                    icon={XCircle}
                />

                <DistributionRow
                    label="에러 / 초과"
                    value={error}
                    total={total}
                    barClassName="bg-orange-500"
                    icon={AlertTriangle}
                />

                <DistributionRow
                    label="대기 / 채점"
                    value={pending}
                    total={total}
                    barClassName="bg-blue-600"
                    icon={RotateCcw}
                />
            </div>
        </SidePanel>
    );
}

function DistributionRow({
                             label,
                             value,
                             total,
                             barClassName,
                             icon: Icon
                         }: {
    label: string;
    value: number;
    total: number;
    barClassName: string;
    icon: ComponentType<{ className?: string }>;
}) {
    const percent = Math.round((value / total) * 100);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="flex items-center gap-2 text-slate-700">
                    <Icon className="h-4 w-4" />
                    {label}
                </span>
                <span className="text-slate-500">{value}개</span>
            </div>

            <ProgressBar value={percent} barClassName={barClassName} />
        </div>
    );
}

function LanguagePanel({ items }: { items: SubmissionItem[] }) {
    const languages = Array.from(new Set(items.map((item) => item.language))).filter(
        (item) => item && item !== "-"
    );

    return (
        <SidePanel title="언어별 제출" badge={<Code2 className="h-5 w-5 text-blue-600" />}>
            {languages.length === 0 ? (
                <p className="text-sm font-bold text-slate-500">
                    표시할 언어별 제출 데이터가 없습니다.
                </p>
            ) : (
                <div className="space-y-3">
                    {languages.map((language) => {
                        const count = items.filter((item) => item.language === language).length;
                        const percent = Math.round((count / Math.max(items.length, 1)) * 100);

                        return (
                            <div key={language}>
                                <div className="mb-2 flex items-center justify-between text-sm font-black">
                                    <Badge variant="blue">{language}</Badge>
                                    <span className="text-slate-500">{count}개</span>
                                </div>
                                <ProgressBar value={percent} />
                            </div>
                        );
                    })}
                </div>
            )}
        </SidePanel>
    );
}

function RecentProblemPanel({ items }: { items: SubmissionItem[] }) {
    const problemMap = new Map<
        number,
        {
            title: string;
            count: number;
            accepted: number;
        }
    >();

    items.forEach((item) => {
        const current = problemMap.get(item.problemId) ?? {
            title: item.problemTitle,
            count: 0,
            accepted: 0
        };

        current.count += 1;

        if (item.status === "accepted") {
            current.accepted += 1;
        }

        problemMap.set(item.problemId, current);
    });

    const rows = Array.from(problemMap.entries())
        .map(([id, value]) => ({
            id,
            ...value
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return (
        <SidePanel
            title="최근 많이 제출한 문제"
            badge={<FileCode2 className="h-5 w-5 text-blue-600" />}
        >
            {rows.length === 0 ? (
                <p className="text-sm font-bold text-slate-500">
                    표시할 문제별 제출 데이터가 없습니다.
                </p>
            ) : (
                <div className="space-y-2">
                    {rows.map((row) => (
                        <Link
                            key={row.id}
                            href={`/problems/${row.id}`}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-800">
                                    {row.title}
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-slate-400">
                                    #{row.id}
                                </p>
                            </div>

                            <div className="text-right text-xs font-black text-slate-500">
                                <p>{row.count}회</p>
                                <p className="mt-0.5 text-emerald-600">AC {row.accepted}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
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

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState<StatusFilter>("전체");
    const [language, setLanguage] = useState<LanguageFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    useEffect(() => {
        let alive = true;

        async function loadDbData() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const items = await fetchSubmissions();

                if (!alive) return;

                setSubmissions(items);
            } catch (error) {
                if (!alive) return;

                setSubmissions([]);
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

        void loadDbData();

        return () => {
            alive = false;
        };
    }, []);

    const languageOptions = useMemo<readonly LanguageFilter[]>(() => {
        const values = Array.from(
            new Set(
                submissions
                    .map((item) => item.language)
                    .filter((item) => item && item !== "-")
            )
        );

        if (values.length === 0) {
            return DEFAULT_LANGUAGE_OPTIONS;
        }

        return ["전체", ...values];
    }, [submissions]);

    const filteredSubmissions = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = submissions.filter((submission) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(submission.id).includes(lowerKeyword) ||
                String(submission.problemId).includes(lowerKeyword) ||
                submission.problemTitle.toLowerCase().includes(lowerKeyword) ||
                submission.user.toLowerCase().includes(lowerKeyword) ||
                submission.language.toLowerCase().includes(lowerKeyword) ||
                submission.note.toLowerCase().includes(lowerKeyword) ||
                submission.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesStatus =
                status === "전체" || submission.status === statusLabelToValue[status];

            const matchesLanguage =
                language === "전체" || submission.language === language;

            return matchesKeyword && matchesStatus && matchesLanguage;
        });

        return [...result].sort((a, b) => {
            switch (sort) {
                case "oldest":
                    return a.submittedAt.localeCompare(b.submittedAt);

                case "time-asc":
                    return (a.timeMs ?? Number.MAX_SAFE_INTEGER) -
                        (b.timeMs ?? Number.MAX_SAFE_INTEGER);

                case "memory-asc":
                    return (a.memoryKb ?? Number.MAX_SAFE_INTEGER) -
                        (b.memoryKb ?? Number.MAX_SAFE_INTEGER);

                case "code-length-desc":
                    return b.codeLength - a.codeLength;

                case "problem-asc":
                    return a.problemId - b.problemId;

                case "recent":
                default:
                    return b.submittedAt.localeCompare(a.submittedAt);
            }
        });
    }, [keyword, status, language, sort, submissions]);

    const acceptedCount = submissions.filter(
        (submission) => submission.status === "accepted"
    ).length;

    const wrongCount = submissions.filter(
        (submission) => submission.status === "wrong"
    ).length;

    const errorCount = submissions.filter(
        (submission) => isErrorStatus(submission.status)
    ).length;

    const pendingCount = submissions.filter(
        (submission) =>
            submission.status === "pending" || submission.status === "judging"
    ).length;

    const acceptedRate =
        Math.round((acceptedCount / Math.max(submissions.length, 1)) * 1000) / 10;

    const averageTime = getAverageTime(submissions);
    const averageMemory = getAverageMemory(submissions);

    const resetFilters = () => {
        setKeyword("");
        setStatus("전체");
        setLanguage("전체");
        setSort("recent");
    };

    if (isLoading) {
        return <LoadingSubmissionsPage />;
    }

    return (
        <AppShell title="제출 기록" description="전체 문제 제출 결과를 검색하고 분석합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Submissions</Badge>
                            <Badge>Judge History</Badge>
                            <Badge variant="green">AC {acceptedCount}</Badge>
                        </>
                    }
                    title="전체 제출 기록을 한눈에 확인하세요."
                    description="문제별 제출 결과, 사용 언어, 실행 시간, 메모리, 코드 길이를 검색하고 오답은 바로 다시 풀 수 있습니다."
                    icon={ListChecks}
                    rightTitle="전체 제출"
                    rightValue={submissions.length.toLocaleString()}
                    rightCaption={`통과율 ${acceptedRate}%`}
                    metrics={[
                        { label: "AC", value: `${acceptedCount}` },
                        { label: "WA", value: `${wrongCount}` },
                        { label: "Error", value: `${errorCount}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton
                                href="/problems"
                                variant="primary"
                                size="lg"
                                iconRight={ArrowRight}
                            >
                                문제 풀기
                            </AppLinkButton>

                            <AppLinkButton
                                href="/notes"
                                variant="white"
                                size="lg"
                                icon={NotebookPen}
                            >
                                오답노트
                            </AppLinkButton>
                        </>
                    }
                />

                {errorMessage && (
                    <Notice title="DB 오류" variant="danger">
                        {errorMessage}
                    </Notice>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="전체 제출"
                        value={submissions.length.toLocaleString()}
                        caption={`대기 ${pendingCount}개 포함`}
                        icon={ListChecks}
                    />

                    <StatCard
                        label="맞았습니다"
                        value={acceptedCount.toLocaleString()}
                        caption={`통과율 ${acceptedRate}%`}
                        icon={CheckCircle2}
                        tone="green"
                    />

                    <StatCard
                        label="평균 시간"
                        value={`${averageTime}ms`}
                        caption="실행 완료 제출 기준"
                        icon={Timer}
                        tone="blue"
                    />

                    <StatCard
                        label="평균 메모리"
                        value={formatMemory(averageMemory)}
                        caption="실행 완료 제출 기준"
                        icon={Database}
                        tone="orange"
                    />
                </section>

                <FilterPanel
                    title="제출 기록 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_180px_180px_190px_auto] xl:items-end"
                >
                    <SearchInput
                        value={keyword}
                        onChange={setKeyword}
                        placeholder="제출 번호, 문제 번호, 문제명, 언어, 태그, 메모 검색"
                    />

                    <FilterSelect
                        label="결과"
                        value={status}
                        onChange={setStatus}
                        options={STATUS_OPTIONS}
                    />

                    <FilterSelect
                        label="언어"
                        value={language}
                        onChange={setLanguage}
                        options={languageOptions}
                    />

                    <FilterSelect
                        label="정렬"
                        value={sort}
                        onChange={setSort}
                        options={SORT_OPTIONS}
                    />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="제출 목록"
                            description={`검색 조건에 맞는 제출 ${filteredSubmissions.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredSubmissions.length === 0 ? (
                            <EmptyState
                                title="제출 기록을 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredSubmissions.map((submission) => (
                                    <SubmissionCard
                                        key={submission.id}
                                        submission={submission}
                                    />
                                ))}
                            </div>
                        ) : (
                            <SubmissionsTable items={filteredSubmissions} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel
                            title="제출 요약"
                            badge={<BarChart3 className="h-5 w-5 text-blue-600" />}
                        >
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">통과율</p>
                                <p className="mt-1 text-5xl font-black">{acceptedRate}%</p>
                                <ProgressBar
                                    value={acceptedRate}
                                    className="mt-5 bg-white/10"
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="AC" value={`${acceptedCount}`} />
                                <MiniStat label="WA" value={`${wrongCount}`} />
                                <MiniStat label="Error" value={`${errorCount}`} />
                            </div>
                        </SidePanel>

                        <StatusDistributionPanel items={submissions} />
                        <LanguagePanel items={submissions} />
                        <RecentProblemPanel items={submissions} />

                        <SidePanel
                            title="추천 행동"
                            badge={<Sparkles className="h-5 w-5 text-blue-600" />}
                        >
                            <div className="space-y-2">
                                <QuickLink
                                    href="/notes"
                                    label="오답노트 정리"
                                    icon={NotebookPen}
                                />
                                <QuickLink
                                    href="/problems?tag=bfs"
                                    label="BFS 문제 다시 풀기"
                                    icon={Target}
                                />
                                <QuickLink href="/sets" label="문제 세트 보기" icon={Trophy} />
                                <QuickLink href="/dashboard" label="대시보드" icon={Gauge} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 화면은 `/api/submissions` DB API 응답만 사용합니다.
                            데이터가 없으면 목업 대신 빈 상태가 표시됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}