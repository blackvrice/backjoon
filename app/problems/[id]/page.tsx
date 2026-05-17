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
    DifficultyBadge,
    ProblemStatusBadge,
    ProblemTable,
    SubmissionStatusBadge,
    type Difficulty,
    type ProblemStatus,
    type SubmissionStatus
} from "@/components/domain";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clipboard,
    Code2,
    Hash,
    Lightbulb,
    ListChecks,
    MemoryStick,
    NotebookPen,
    Search,
    Sparkles,
    Target,
    Timer
} from "lucide-react";

type ProblemCategory = string;
type DetailTab = "description" | "examples" | "submissions" | "related";

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
    source: string;
    tags: string[];
    memo: string;
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string[];
    examples: ProblemExample[];
    hints: string[];
    recommendedOrder: number;
};

type ApiProblemDetail = Partial<
    Omit<ProblemDetail, "difficulty" | "status" | "examples">
> & {
    difficulty?: string;
    status?: string;
    examples?: ProblemExample[];
};

type Submission = {
    id: number;
    problemId: number;
    status: SubmissionStatus;
    language: string;
    time: string;
    memory: string;
    submittedAt: string;
    codeLength: string;
};

type ApiSubmission = Partial<Submission> & {
    executionTimeMs?: number | null;
    memoryKb?: number | null;
    code?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

type ProblemDetailApiResponse = {
    ok: boolean;
    message?: string;
    problem?: ApiProblemDetail;
    submissions?: ApiSubmission[];
    relatedProblems?: ApiProblemDetail[];
};

const tabLabels: Record<DetailTab, string> = {
    description: "문제 설명",
    examples: "예제",
    submissions: "제출 기록",
    related: "관련 문제"
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

function formatExecutionTime(ms?: number | null) {
    return typeof ms === "number" ? `${ms}ms` : "-";
}

function formatMemoryKb(kb?: number | null) {
    return typeof kb === "number" ? `${kb.toLocaleString()}KB` : "-";
}

function formatCodeLength(code?: string | null, fallback?: string) {
    if (fallback) return fallback;

    if (typeof code === "string") {
        return `${new Blob([code]).size.toLocaleString()}B`;
    }

    return "-";
}

function formatDateTime(value?: string | Date) {
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
        source: problem.source ?? "Local",
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        memo: problem.memo ?? "",
        description: problem.description ?? "",
        inputDescription: problem.inputDescription ?? "",
        outputDescription: problem.outputDescription ?? "",
        constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
        examples: Array.isArray(problem.examples) ? problem.examples : [],
        hints: Array.isArray(problem.hints) ? problem.hints : [],
        recommendedOrder: Number(problem.recommendedOrder ?? 0)
    };
}

function normalizeSubmissionFromApi(submission: ApiSubmission): Submission {
    return {
        id: Number(submission.id ?? 0),
        problemId: Number(submission.problemId ?? 0),
        status: normalizeSubmissionStatus(submission.status),
        language: submission.language ?? "-",
        time: submission.time ?? formatExecutionTime(submission.executionTimeMs),
        memory: submission.memory ?? formatMemoryKb(submission.memoryKb),
        submittedAt: submission.submittedAt ?? formatDateTime(submission.createdAt),
        codeLength: formatCodeLength(submission.code, submission.codeLength)
    };
}

async function fetchProblemDetail(id: string): Promise<{
    problem: ProblemDetail;
    submissions: Submission[];
    relatedProblems: ProblemDetail[];
}> {
    const response = await fetch(`/api/problems/${id}`, {
        method: "GET",
        cache: "no-store"
    });

    const data = (await response.json()) as ProblemDetailApiResponse;

    if (!response.ok || !data.ok || !data.problem) {
        throw new Error(data.message ?? "문제를 불러오지 못했습니다.");
    }

    return {
        problem: normalizeProblemFromApi(data.problem),
        submissions: Array.isArray(data.submissions)
            ? data.submissions.map(normalizeSubmissionFromApi)
            : [],
        relatedProblems: Array.isArray(data.relatedProblems)
            ? data.relatedProblems.map(normalizeProblemFromApi)
            : []
    };
}

function getProgressTone(status: ProblemStatus) {
    switch (status) {
        case "solved":
            return "bg-emerald-600";

        case "wrong":
            return "bg-rose-600";

        case "review":
            return "bg-blue-600";

        case "todo":
        default:
            return "bg-orange-500";
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

function DescriptionTab({ problem }: { problem: ProblemDetail }) {
    return (
        <div className="space-y-4">
            <Card className="p-6">
                <h3 className="text-xl font-black text-slate-950">문제</h3>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600">
                    {problem.description || "등록된 문제 설명이 없습니다."}
                </p>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card className="p-6">
                    <h3 className="text-xl font-black text-slate-950">입력</h3>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600">
                        {problem.inputDescription || "등록된 입력 설명이 없습니다."}
                    </p>
                </Card>

                <Card className="p-6">
                    <h3 className="text-xl font-black text-slate-950">출력</h3>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600">
                        {problem.outputDescription || "등록된 출력 설명이 없습니다."}
                    </p>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-xl font-black text-slate-950">제한</h3>

                {problem.constraints.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                        {problem.constraints.map((constraint) => (
                            <li key={constraint} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                <span>{constraint}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-sm leading-7 text-slate-500">
                        등록된 제한 조건이 없습니다.
                    </p>
                )}
            </Card>
        </div>
    );
}

function ExamplesTab({ problem }: { problem: ProblemDetail }) {
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
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                        <h3 className="font-black text-slate-950">예제 {index + 1}</h3>
                    </div>

                    <div className="grid gap-0 xl:grid-cols-2">
                        <ExampleBlock title="입력" value={example.input} />
                        <ExampleBlock title="출력" value={example.output} />
                    </div>

                    {example.explanation && (
                        <div className="border-t border-slate-100 p-6">
                            <h4 className="font-black text-slate-950">설명</h4>
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                {example.explanation}
                            </p>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}

function ExampleBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="border-b border-slate-100 p-6 xl:border-b-0 xl:border-r last:xl:border-r-0">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="font-black text-slate-950">{title}</h4>
                <Badge>{title === "입력" ? "stdin" : "stdout"}</Badge>
            </div>

            <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
                <code>{value}</code>
            </pre>
        </div>
    );
}

function SubmissionsTab({ submissions }: { submissions: Submission[] }) {
    if (submissions.length === 0) {
        return (
            <EmptyState
                title="제출 기록이 없습니다."
                description="아직 이 문제에 대한 제출 기록이 없습니다. 풀이를 시작해보세요."
                icon={ListChecks}
            />
        );
    }

    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">제출 번호</th>
                        <th className="px-5 py-4">결과</th>
                        <th className="px-5 py-4">언어</th>
                        <th className="px-5 py-4">시간</th>
                        <th className="px-5 py-4">메모리</th>
                        <th className="px-5 py-4">코드 길이</th>
                        <th className="px-5 py-4">제출 시간</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {submissions.map((submission) => (
                        <tr key={submission.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4 font-black text-slate-700">
                                #{submission.id}
                            </td>

                            <td className="px-5 py-4">
                                <SubmissionStatusBadge value={submission.status} />
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-600">
                                {submission.language}
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-600">
                                {submission.time}
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-600">
                                {submission.memory}
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-600">
                                {submission.codeLength}
                            </td>

                            <td className="px-5 py-4 font-bold text-slate-500">
                                {submission.submittedAt}
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

function RelatedTab({ relatedProblems }: { relatedProblems: ProblemDetail[] }) {
    if (relatedProblems.length === 0) {
        return (
            <EmptyState
                title="관련 문제가 없습니다."
                description="같은 분류 또는 태그를 가진 문제가 아직 없습니다."
                icon={Search}
            />
        );
    }

    return (
        <ProblemTable
            problems={relatedProblems}
            showCategory
            showScore
            showSolvedRate
            showSubmissions={false}
            showLimits={false}
            showTags
        />
    );
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
            description="DB에서 문제 상세 정보를 가져오고 있습니다."
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

export default function ProblemDetailPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");

    const [problem, setProblem] = useState<ProblemDetail | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [relatedProblems, setRelatedProblems] = useState<ProblemDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>("description");

    useEffect(() => {
        let alive = true;

        async function loadProblem() {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const data = await fetchProblemDetail(id);

                if (!alive) return;

                setProblem(data.problem);
                setSubmissions(data.submissions);
                setRelatedProblems(data.relatedProblems);
                setActiveTab("description");
            } catch (error) {
                if (!alive) return;

                setProblem(null);
                setSubmissions([]);
                setRelatedProblems([]);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "문제를 불러오지 못했습니다."
                );
            } finally {
                if (alive) {
                    setIsLoading(false);
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

    const acceptedRate = useMemo(() => {
        if (!problem) return 0;

        return Math.round((problem.accepted / Math.max(problem.submissions, 1)) * 1000) / 10;
    }, [problem]);

    if (isLoading) {
        return <LoadingProblem />;
    }

    if (errorMessage || !problem) {
        return <NotFoundProblem id={id} message={errorMessage ?? undefined} />;
    }

    const progressTone = getProgressTone(problem.status);

    return (
        <AppShell
            title={`${problem.number}. ${problem.title}`}
            description={`${problem.category} · ${problem.difficulty} · ${problem.timeLimit} / ${problem.memoryLimit}`}
        >
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link
                                href="/problems"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                문제 목록
                            </Link>

                            <Badge variant="blue">Problem #{problem.number}</Badge>
                            <Badge>{problem.category}</Badge>
                            <DifficultyBadge value={problem.difficulty} />
                            <ProblemStatusBadge value={problem.status} />
                        </>
                    }
                    title={problem.title}
                    description={problem.memo}
                    icon={BookOpen}
                    rightTitle="정답률"
                    rightValue={`${problem.solvedRate}%`}
                    rightCaption={`${problem.accepted} / ${problem.submissions} accepted`}
                    metrics={[
                        { label: "점수", value: `${problem.score}` },
                        { label: "시간", value: problem.timeLimit },
                        { label: "메모리", value: problem.memoryLimit }
                    ]}
                    actions={
                        <>
                            <AppLinkButton
                                href={`/problems/${problem.id}/solve`}
                                variant="primary"
                                size="lg"
                                iconRight={ArrowRight}
                            >
                                풀이 시작
                            </AppLinkButton>

                            <AppLinkButton
                                href={`/problems/${problem.id}/submissions`}
                                variant="white"
                                size="lg"
                            >
                                제출 기록
                            </AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="제출"
                        value={problem.submissions.toLocaleString()}
                        caption="이 문제 전체 제출"
                        icon={ListChecks}
                    />

                    <StatCard
                        label="맞은 제출"
                        value={problem.accepted.toLocaleString()}
                        caption={`AC 비율 ${acceptedRate}%`}
                        icon={CheckCircle2}
                        tone="green"
                    />

                    <StatCard
                        label="시간 제한"
                        value={problem.timeLimit}
                        caption="채점 실행 시간"
                        icon={Timer}
                        tone="blue"
                    />

                    <StatCard
                        label="메모리 제한"
                        value={problem.memoryLimit}
                        caption="최대 사용 메모리"
                        icon={MemoryStick}
                        tone="orange"
                    />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(["description", "examples", "submissions", "related"] as DetailTab[]).map(
                                    (tab) => (
                                        <TabButton
                                            key={tab}
                                            tab={tab}
                                            activeTab={activeTab}
                                            onClick={setActiveTab}
                                        />
                                    )
                                )}
                            </div>
                        </Card>

                        {activeTab === "description" && <DescriptionTab problem={problem} />}
                        {activeTab === "examples" && <ExamplesTab problem={problem} />}
                        {activeTab === "submissions" && <SubmissionsTab submissions={submissions} />}
                        {activeTab === "related" && <RelatedTab relatedProblems={relatedProblems} />}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="문제 상태" badge={<ProblemStatusBadge value={problem.status} />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">정답률</p>
                                <p className="mt-1 text-5xl font-black">{problem.solvedRate}%</p>
                                <ProgressBar
                                    value={problem.solvedRate}
                                    className="mt-5 bg-white/10"
                                    barClassName={progressTone}
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="점수" value={`${problem.score}`} />
                                <MiniStat label="제출" value={`${problem.submissions}`} />
                                <MiniStat label="관련" value={`${relatedProblems.length}`} />
                            </div>
                        </SidePanel>

                        <SidePanel title="태그" badge={<Hash className="h-5 w-5 text-blue-600" />}>
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

                        <SidePanel title="풀이 힌트" badge={<Lightbulb className="h-5 w-5 text-blue-600" />}>
                            {problem.hints.length > 0 ? (
                                <div className="space-y-2">
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
                            ) : (
                                <p className="text-sm font-bold text-slate-500">
                                    등록된 힌트가 없습니다.
                                </p>
                            )}
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink
                                    href={`/problems/${problem.id}/solve`}
                                    label="풀이 화면"
                                    icon={Code2}
                                />

                                <QuickLink
                                    href={`/problems/${problem.id}/submissions`}
                                    label="이 문제 제출 기록"
                                    icon={ListChecks}
                                />

                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/sets" label="문제 세트" icon={Target} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 페이지는 `/api/problems/[id]` 응답을 기준으로 문제 상세,
                            예제, 제출 기록, 관련 문제를 렌더링합니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}