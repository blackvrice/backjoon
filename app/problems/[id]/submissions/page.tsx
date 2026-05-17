"use client";

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
    DifficultyBadge,
    ProblemStatusBadge,
    SubmissionStatusBadge,
    type Difficulty,
    type ProblemStatus,
    type SubmissionStatus
} from "@/components/domain";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Gauge,
    History,
    ListChecks,
    MemoryStick,
    NotebookPen,
    RotateCcw,
    Search,
    Sparkles,
    Timer,
    XCircle
} from "lucide-react";
import { toSubmissionStatus } from "@/components/domain/SubmissionStatusBadge";

type ProblemCategory = string;

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
type SortOption = "recent" | "oldest" | "time-asc" | "memory-asc" | "code-length-desc";

type ProblemDetail = {
    dbId: number;
    id: number;
    number: number;
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
    tags: string[];
    memo: string;
};

type ApiProblemDetail = Partial<
    Omit<ProblemDetail, "difficulty" | "status">
> & {
    difficulty?: string;
    status?: string;
};

type ProblemSubmission = {
    id: number;
    problemId: number;
    status: SubmissionStatus;
    language: string;
    timeMs: number | null;
    memoryKb: number | null;
    codeLength: number;
    submittedAt: string;
    submittedAtText: string;
    user: string;
    note: string;
};

type ApiSubmission = {
    id?: number;
    problemId?: number;
    status?: string;
    language?: string | null;
    timeMs?: number | null;
    executionTimeMs?: number | null;
    memoryKb?: number | null;
    codeLength?: number | string | null;
    code?: string | null;
    sourceCode?: string | null;
    submittedAt?: string | Date | null;
    createdAt?: string | Date | null;
    user?: string | null;
    userName?: string | null;
    note?: string | null;
    resultMessage?: string | null;
};

type ProblemSubmissionsApiResponse = {
    ok: boolean;
    message?: string;
    problem?: ApiProblemDetail;
    submissions?: ApiSubmission[];
};

const LIVE_REFRESH_INTERVAL_MS = 1500;

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
    "code-length-desc"
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
    "code-length-desc": "코드 길이 긴순"
};

function isLiveStatus(status: SubmissionStatus) {
    return status === "pending" || status === "judging";
}

function isJudgedStatus(status: SubmissionStatus) {
    return status !== "pending" && status !== "judging";
}

function formatLastUpdated(value: Date | null) {
    if (!value) return "-";

    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    const ss = String(value.getSeconds()).padStart(2, "0");

    return `${hh}:${mm}:${ss}`;
}

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

    if (
        text === "solved" ||
        text === "wrong" ||
        text === "todo" ||
        text === "review"
    ) {
        return text as ProblemStatus;
    }

    if (text === "published") return "todo" as ProblemStatus;
    if (text === "draft") return "todo" as ProblemStatus;
    if (text === "archived") return "todo" as ProblemStatus;

    return "todo" as ProblemStatus;
}

function normalizeSubmissionStatus(value: unknown): SubmissionStatus {
    const text = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    switch (text) {
        case "accepted":
        case "ac":
        case "success":
            return "accepted" as SubmissionStatus;

        case "wrong":
        case "wronganswer":
        case "wa":
            return "wrong" as SubmissionStatus;

        case "compile":
        case "compileerror":
        case "ce":
            return "compile" as SubmissionStatus;

        case "runtime":
        case "runtimeerror":
        case "re":
            return "runtime" as SubmissionStatus;

        case "timelimit":
        case "tle":
        case "timeout":
        case "memorylimit":
        case "mle":
            return "timeLimit" as SubmissionStatus;

        case "judging":
        case "running":
            return "judging" as SubmissionStatus;

        case "pending":
        case "queued":
        default:
            return "pending" as SubmissionStatus;
    }
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

function formatTime(timeMs: number | null) {
    return timeMs === null ? "-" : `${timeMs}ms`;
}

function formatMemory(memoryKb: number | null) {
    if (memoryKb === null) {
        return "-";
    }

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

function normalizeProblemFromApi(problem: ApiProblemDetail): ProblemDetail {
    const dbId = Number(problem.dbId ?? problem.id ?? 0);
    const number = Number(problem.number ?? problem.id ?? 0);
    const timeLimitMs = Number(problem.timeLimitMs ?? 1000);
    const memoryLimitMb = Number(problem.memoryLimitMb ?? 256);

    return {
        dbId,
        id: number,
        number,
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
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        memo: problem.memo ?? ""
    };
}

function normalizeSubmissionFromApi(submission: ApiSubmission): ProblemSubmission {
    const submittedAtSource = submission.submittedAt ?? submission.createdAt ?? null;

    return {
        id: Number(submission.id ?? 0),
        problemId: Number(submission.problemId ?? 0),
        status: normalizeSubmissionStatus(submission.status),
        language: submission.language ?? "-",
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
        user: submission.userName ?? submission.user ?? "local",
        note: submission.note ?? submission.resultMessage ?? ""
    };
}

async function fetchProblemSubmissions(id: string): Promise<{
    problem: ProblemDetail;
    submissions: ProblemSubmission[];
}> {
    const response = await fetch(`/api/problems/${id}/submissions`, {
        method: "GET",
        cache: "no-store"
    });

    const data = (await response.json()) as ProblemSubmissionsApiResponse;

    if (!response.ok || !data.ok || !data.problem) {
        throw new Error(data.message ?? "제출 기록을 불러오지 못했습니다.");
    }

    return {
        problem: normalizeProblemFromApi(data.problem),
        submissions: Array.isArray(data.submissions)
            ? data.submissions.map(normalizeSubmissionFromApi)
            : []
    };
}

function getAverageTime(submissions: ProblemSubmission[]) {
    const values = submissions
        .map((item) => item.timeMs)
        .filter((value): value is number => value !== null);

    if (values.length === 0) {
        return 0;
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getAverageMemory(submissions: ProblemSubmission[]) {
    const values = submissions
        .map((item) => item.memoryKb)
        .filter((value): value is number => value !== null);

    if (values.length === 0) {
        return 0;
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
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

function LoadingPage() {
    return (
        <AppShell
            title="제출 기록을 불러오는 중입니다"
            description="DB에서 문제와 제출 기록을 가져오고 있습니다."
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

function SubmissionCard({
                            submission,
                            problemRouteId
                        }: {
    submission: ProblemSubmission;
    problemRouteId: number;
}) {
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
                        href={`/submissions/${submission.id}`}
                        className="text-xl font-black text-slate-950 transition hover:text-blue-600"
                    >
                        제출 #{submission.id}
                    </Link>

                    <p className="mt-2 text-sm leading-7 text-slate-500">
                        {submission.note || "제출 결과 상세를 확인하세요."}
                    </p>
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
                        href={`/problems/${problemRouteId}/solve`}
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

function SubmissionsTable({ submissions }: { submissions: ProblemSubmission[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">제출 번호</th>
                        <th className="px-5 py-4">결과</th>
                        <th className="px-5 py-4">언어</th>
                        <th className="px-5 py-4 text-right">시간</th>
                        <th className="px-5 py-4 text-right">메모리</th>
                        <th className="px-5 py-4 text-right">코드 길이</th>
                        <th className="px-5 py-4">제출자</th>
                        <th className="px-5 py-4">제출 시간</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {submissions.map((submission) => (
                        <tr key={submission.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link
                                    href={`/submissions/${submission.id}`}
                                    className="font-black text-slate-950 transition hover:text-blue-600"
                                >
                                    #{submission.id}
                                </Link>

                                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">
                                    {submission.note || "제출 결과 상세를 확인하세요."}
                                </p>
                            </td>

                            <td className="px-5 py-4">
                                <SubmissionStatusBadge value={submission.status} />
                            </td>

                            <td className="px-5 py-4">
                                <Badge variant="blue">{submission.language}</Badge>
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-slate-600">
                                {formatTime(submission.timeMs)}
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-slate-600">
                                {formatMemory(submission.memoryKb)}
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-slate-600">
                                {submission.codeLength.toLocaleString()}B
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-600">
                                {submission.user}
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-500">
                                {submission.submittedAtText}
                            </td>

                            <td className="px-5 py-4 text-right">
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
        </Card>
    );
}

function StatusDistributionPanel({ submissions }: { submissions: ProblemSubmission[] }) {
    const accepted = submissions.filter((item) => item.status === "accepted").length;
    const wrong = submissions.filter((item) => item.status === "wrong").length;
    const error = submissions.filter(
        (item) =>
            item.status === "compile" ||
            item.status === "runtime" ||
            item.status === "timeLimit"
    ).length;
    const pending = submissions.filter(
        (item) => item.status === "pending" || item.status === "judging"
    ).length;
    const total = Math.max(submissions.length, 1);

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

export default function ProblemSubmissionsPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");

    const [problem, setProblem] = useState<ProblemDetail | null>(null);
    const [problemSubmissions, setProblemSubmissions] = useState<ProblemSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [refreshErrorMessage, setRefreshErrorMessage] = useState<string | null>(null);

    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState<StatusFilter>("전체");
    const [language, setLanguage] = useState<LanguageFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const loadData = useCallback(
        async ({
                   silent = false,
                   resetFilters = false
               }: {
            silent?: boolean;
            resetFilters?: boolean;
        } = {}) => {
            if (!id) return;

            if (silent) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            if (!silent) {
                setErrorMessage(null);
            }

            try {
                const data = await fetchProblemSubmissions(id);

                setProblem(data.problem);
                setProblemSubmissions(data.submissions);
                setLastUpdatedAt(new Date());
                setRefreshErrorMessage(null);

                if (resetFilters) {
                    setKeyword("");
                    setStatus("전체");
                    setLanguage("전체");
                    setSort("recent");
                }
            } catch (error) {
                const nextMessage =
                    error instanceof Error
                        ? error.message
                        : "제출 기록을 불러오지 못했습니다.";

                if (silent) {
                    setRefreshErrorMessage(nextMessage);
                } else {
                    setProblem(null);
                    setProblemSubmissions([]);
                    setErrorMessage(nextMessage);
                }
            } finally {
                if (silent) {
                    setIsRefreshing(false);
                } else {
                    setIsLoading(false);
                }
            }
        },
        [id]
    );

    useEffect(() => {
        void loadData({
            resetFilters: true
        });
    }, [loadData]);

    const hasLiveSubmission = useMemo(
        () => problemSubmissions.some((submission) => isLiveStatus(submission.status)),
        [problemSubmissions]
    );

    useEffect(() => {
        if (!id || !problem || !hasLiveSubmission) {
            return;
        }

        const timer = window.setInterval(() => {
            void loadData({
                silent: true
            });
        }, LIVE_REFRESH_INTERVAL_MS);

        return () => {
            window.clearInterval(timer);
        };
    }, [id, problem, hasLiveSubmission, loadData]);

    const languageOptions = useMemo<readonly LanguageFilter[]>(() => {
        const values = Array.from(
            new Set(
                problemSubmissions
                    .map((submission) => submission.language)
                    .filter((item) => item && item !== "-")
            )
        );

        if (values.length === 0) {
            return DEFAULT_LANGUAGE_OPTIONS;
        }

        return ["전체", ...values];
    }, [problemSubmissions]);

    const filteredSubmissions = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = problemSubmissions.filter((submission) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(submission.id).includes(lowerKeyword) ||
                submission.user.toLowerCase().includes(lowerKeyword) ||
                submission.language.toLowerCase().includes(lowerKeyword) ||
                submission.note.toLowerCase().includes(lowerKeyword);

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

                case "recent":
                default:
                    return b.submittedAt.localeCompare(a.submittedAt);
            }
        });
    }, [keyword, status, language, sort, problemSubmissions]);

    const acceptedCount = useMemo(
        () => problemSubmissions.filter((submission) => submission.status === "accepted").length,
        [problemSubmissions]
    );

    const wrongCount = useMemo(
        () => problemSubmissions.filter((submission) => submission.status === "wrong").length,
        [problemSubmissions]
    );

    const errorCount = useMemo(
        () =>
            problemSubmissions.filter(
                (submission) =>
                    submission.status === "compile" ||
                    submission.status === "runtime" ||
                    submission.status === "timeLimit"
            ).length,
        [problemSubmissions]
    );

    const judgedSubmissions = useMemo(
        () => problemSubmissions.filter((submission) => isJudgedStatus(submission.status)),
        [problemSubmissions]
    );

    const acceptedRate =
        judgedSubmissions.length === 0
            ? 0
            : Math.round((acceptedCount / judgedSubmissions.length) * 1000) / 10;

    const averageTime = getAverageTime(judgedSubmissions);
    const averageMemory = getAverageMemory(judgedSubmissions);

    const resetFilters = () => {
        setKeyword("");
        setStatus("전체");
        setLanguage("전체");
        setSort("recent");
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (errorMessage || !problem) {
        return <NotFoundProblem id={id} message={errorMessage ?? undefined} />;
    }

    return (
        <AppShell
            title={`${problem.number}. ${problem.title} 제출 기록`}
            description={`${problem.category} · ${problem.difficulty} · 제출 ${problemSubmissions.length}개`}
        >
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link
                                href={`/problems/${problem.id}`}
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                문제 상세
                            </Link>

                            <Badge variant="blue">Submissions</Badge>
                            {hasLiveSubmission && <Badge variant="orange">Live Judging</Badge>}
                            {isRefreshing && <Badge>Refreshing...</Badge>}
                            <Badge>{problem.category}</Badge>
                            <DifficultyBadge value={problem.difficulty} />
                            <ProblemStatusBadge value={problem.status} />
                        </>
                    }
                    title={`${problem.title} 제출 기록`}
                    description="이 문제에 대한 제출 결과, 사용 언어, 실행 시간, 메모리, 코드 길이를 확인할 수 있습니다. 실패한 제출은 오답노트나 풀이 화면으로 바로 연결하세요."
                    icon={ListChecks}
                    rightTitle="이 문제 제출"
                    rightValue={problemSubmissions.length.toLocaleString()}
                    rightCaption={`통과율 ${acceptedRate}%`}
                    metrics={[
                        { label: "AC", value: `${acceptedCount}` },
                        { label: "WA", value: `${wrongCount}` },
                        { label: "Error", value: `${errorCount}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton
                                href={`/problems/${problem.id}/solve`}
                                variant="primary"
                                size="lg"
                                iconRight={ArrowRight}
                            >
                                다시 풀기
                            </AppLinkButton>

                            <AppLinkButton href="/submissions" variant="white" size="lg">
                                전체 제출 기록
                            </AppLinkButton>
                        </>
                    }
                />

                {hasLiveSubmission && (
                    <Notice title="실시간 채점 중" variant="info">
                        채점 대기 또는 채점 중인 제출이 있어 결과를 자동으로 갱신하고 있습니다.
                    </Notice>
                )}

                {refreshErrorMessage && (
                    <Notice title="자동 갱신 오류" variant="warning">
                        {refreshErrorMessage}
                    </Notice>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="제출"
                        value={problemSubmissions.length.toLocaleString()}
                        caption={`마지막 갱신 ${formatLastUpdated(lastUpdatedAt)}`}
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
                        icon={MemoryStick}
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
                        placeholder="제출 번호, 언어, 사용자, 메모 검색"
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
                            description={`검색 조건에 맞는 제출 ${filteredSubmissions.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]} · 마지막 갱신 ${formatLastUpdated(lastUpdatedAt)}`}
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
                                        problemRouteId={problem.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <SubmissionsTable submissions={filteredSubmissions} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="문제 요약" badge={<BookOpen className="h-5 w-5 text-blue-600" />}>
                            <p className="text-sm leading-7 text-slate-600">
                                {problem.memo || "등록된 문제 메모가 없습니다."}
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <MiniStat label="난이도" value={problem.difficulty} />
                                <MiniStat label="점수" value={`${problem.score}`} />
                                <MiniStat label="시간" value={problem.timeLimit} />
                                <MiniStat label="메모리" value={problem.memoryLimit} />
                            </div>
                        </SidePanel>

                        <StatusDistributionPanel submissions={problemSubmissions} />

                        <SidePanel title="태그" badge={<BarChart3 className="h-5 w-5 text-blue-600" />}>
                            {problem.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {problem.tags.map((tag) => (
                                        <Link key={tag} href={`/problems?tag=${tag}`}>
                                            <Badge>{tag}</Badge>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-slate-500">
                                    등록된 태그가 없습니다.
                                </p>
                            )}
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink
                                    href={`/problems/${problem.id}`}
                                    label="문제 상세"
                                    icon={BookOpen}
                                />

                                <QuickLink
                                    href={`/problems/${problem.id}/solve`}
                                    label="풀이 화면"
                                    icon={Code2}
                                />

                                <QuickLink
                                    href="/submissions"
                                    label="전체 제출 기록"
                                    icon={History}
                                />

                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 페이지는 `/api/problems/[id]/submissions` 응답을 기준으로
                            문제 정보와 제출 목록을 렌더링합니다.
                            pending 또는 judging 상태가 있으면 1.5초마다 자동 갱신합니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}