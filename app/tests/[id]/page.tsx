"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
    DifficultyBadge,
    ProblemCard,
    ProblemStatusBadge,
    ProblemTable,
    type Difficulty,
    type ProblemCardData,
    type ProblemStatus
} from "@/components/domain";
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    FileText,
    Flame,
    Gauge,
    Layers3,
    Lightbulb,
    ListChecks,
    NotebookPen,
    Play,
    RotateCcw,
    Search,
    ShieldCheck,
    Target,
    Terminal,
    Timer,
    Trophy,
    Zap
} from "lucide-react";

type TestCategory = "입문" | "자료구조" | "그래프" | "DP" | "종합" | "기업형";
type TestStatus = "scheduled" | "open" | "completed" | "review";
type DetailTab = "overview" | "problems" | "rules" | "analysis";
type DifficultyFilter = "전체" | Difficulty;
type ProblemStatusFilter = "전체" | "해결" | "오답" | "미해결" | "복습";
type SortOption = "order" | "number-asc" | "difficulty" | "score-desc" | "solved-rate" | "status";

type TestProblem = ProblemCardData & {
    order: number;
    category: string;
    required: boolean;
    points: number;
    estimatedMinutes: number;
    reason: string;
};

type TestDetail = {
    id: string;
    title: string;
    description: string;
    category: TestCategory;
    difficulty: Difficulty;
    status: TestStatus;
    recommended: boolean;
    featured: boolean;
    totalScore: number;
    myScore: number | null;
    durationMinutes: number;
    participants: number;
    averageScore: number;
    rank: number | null;
    startAt: string;
    startAtText: string;
    endAt: string;
    endAtText: string;
    updatedAt: string;
    tags: string[];
    companies: string[];
    rules: string[];
    guide: string[];
    analysis: Array<{
        title: string;
        description: string;
        value: string;
        tone: "blue" | "green" | "orange" | "red";
    }>;
    problems: TestProblem[];
};

const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly ProblemStatusFilter[] = ["전체", "해결", "오답", "미해결", "복습"];
const SORT_OPTIONS: readonly SortOption[] = ["order", "number-asc", "difficulty", "score-desc", "solved-rate", "status"];

const statusLabelToValue: Record<Exclude<ProblemStatusFilter, "전체">, ProblemStatus> = {
    해결: "solved",
    오답: "wrong",
    미해결: "todo",
    복습: "review"
};

const sortLabels: Record<SortOption, string> = {
    order: "시험 순서",
    "number-asc": "번호 낮은순",
    difficulty: "난이도순",
    "score-desc": "배점 높은순",
    "solved-rate": "정답률 높은순",
    status: "상태순"
};

const difficultyOrder: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3
};

const statusOrder: Record<ProblemStatus, number> = {
    wrong: 1,
    review: 2,
    todo: 3,
    solved: 4
};

const testStatusMeta: Record<TestStatus, { label: string; variant: "default" | "blue" | "green" | "orange"; icon: ComponentType<{ className?: string }> }> = {
    scheduled: { label: "예정", variant: "default", icon: Clock3 },
    open: { label: "응시 가능", variant: "blue", icon: Play },
    completed: { label: "완료", variant: "green", icon: CheckCircle2 },
    review: { label: "복습", variant: "orange", icon: RotateCcw }
};

const analysisToneClass: Record<TestDetail["analysis"][number]["tone"], string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-rose-50 text-rose-700"
};

function normalizeTestFromApi(data: unknown): TestDetail | null {
    const payload = data as { test?: Partial<TestDetail> & { durationMin?: number; type?: string }; problems?: TestProblem[] } | null;
    const test = payload?.test;

    if (!test?.id || !test.title) {
        return null;
    }

    const problems = Array.isArray(test.problems)
        ? test.problems
        : Array.isArray(payload?.problems)
            ? payload.problems
            : [];
    const totalScore = Number(test.totalScore ?? problems.reduce((sum, problem) => sum + Number(problem.points ?? problem.score ?? 0), 0));

    return {
        id: String(test.id),
        title: String(test.title),
        description: String(test.description ?? ""),
        category: String(test.category ?? test.type ?? "test") as TestCategory,
        difficulty: (test.difficulty === "Medium" || test.difficulty === "Hard" ? test.difficulty : "Easy") as Difficulty,
        status: (test.status === "scheduled" || test.status === "completed" || test.status === "review" ? test.status : "open") as TestStatus,
        recommended: Boolean(test.recommended ?? true),
        featured: Boolean(test.featured ?? false),
        totalScore,
        myScore: test.myScore == null ? null : Number(test.myScore),
        durationMinutes: Number(test.durationMinutes ?? test.durationMin ?? 0),
        participants: Number(test.participants ?? 0),
        averageScore: Number(test.averageScore ?? 0),
        rank: test.rank == null ? null : Number(test.rank),
        startAt: String(test.startAt ?? ""),
        startAtText: String(test.startAtText ?? "-"),
        endAt: String(test.endAt ?? ""),
        endAtText: String(test.endAtText ?? "-"),
        updatedAt: String(test.updatedAt ?? ""),
        tags: Array.isArray(test.tags) ? test.tags.map(String) : [],
        companies: Array.isArray(test.companies) ? test.companies.map(String) : [],
        rules: Array.isArray(test.rules) ? test.rules.map(String) : [],
        guide: Array.isArray(test.guide) ? test.guide.map(String) : [],
        analysis: Array.isArray(test.analysis) ? test.analysis as TestDetail["analysis"] : [],
        problems: problems.map((problem, index) => ({
            ...problem,
            order: Number(problem.order ?? index + 1),
            id: Number(problem.id),
            title: String(problem.title ?? ""),
            difficulty: (problem.difficulty === "Medium" || problem.difficulty === "Hard" ? problem.difficulty : "Easy") as Difficulty,
            category: String(problem.category ?? ""),
            status: (problem.status === "solved" || problem.status === "wrong" || problem.status === "review" ? problem.status : "todo") as ProblemStatus,
            score: Number(problem.score ?? problem.points ?? 0),
            points: Number(problem.points ?? problem.score ?? 0),
            solvedRate: Number(problem.solvedRate ?? 0),
            submissions: Number(problem.submissions ?? 0),
            timeLimit: String(problem.timeLimit ?? "-"),
            memoryLimit: String(problem.memoryLimit ?? "-"),
            tags: Array.isArray(problem.tags) ? problem.tags.map(String) : [],
            memo: String(problem.memo ?? ""),
            recommendedOrder: Number(problem.recommendedOrder ?? problem.order ?? index + 1),
            required: Boolean(problem.required ?? true),
            estimatedMinutes: Number(problem.estimatedMinutes ?? 0),
            reason: String(problem.reason ?? ""),
        })),
    };
}

function getSolvedCount(test: TestDetail) {
    return test.problems.filter((problem) => problem.status === "solved").length;
}

function getWrongCount(test: TestDetail) {
    return test.problems.filter((problem) => problem.status === "wrong").length;
}

function getProgress(test: TestDetail) {
    return Math.round((getSolvedCount(test) / Math.max(test.problems.length, 1)) * 100);
}

function getScoreRate(test: TestDetail) {
    if (test.myScore === null) return 0;
    return Math.round((test.myScore / Math.max(test.totalScore, 1)) * 100);
}

function getNextProblem(test: TestDetail) {
    return test.problems.find((problem) => problem.status !== "solved") ?? test.problems[0];
}

function getPrimaryActionHref(test: TestDetail) {
    if (test.status === "completed" || test.status === "review") return `/tests/${test.id}/result`;
    if (test.status === "scheduled") return `/tests/${test.id}`;
    return `/tests/${test.id}/solve`;
}

function getPrimaryActionLabel(status: TestStatus) {
    switch (status) {
        case "scheduled":
            return "상세 보기";
        case "open":
            return "응시하기";
        case "completed":
            return "결과 보기";
        case "review":
            return "복습하기";
        default:
            return "상세 보기";
    }
}

function TestStatusBadge({ status }: { status: TestStatus }) {
    const meta = testStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function TabButton({ tab, activeTab, onClick }: { tab: DetailTab; activeTab: DetailTab; onClick: (tab: DetailTab) => void }) {
    const labels: Record<DetailTab, string> = {
        overview: "개요",
        problems: "문제",
        rules: "규칙",
        analysis: "분석"
    };

    return (
        <button
            type="button"
            onClick={() => onClick(tab)}
            className={`rounded-2xl px-4 py-3 text-sm font-black transition ${activeTab === tab ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}
        >
            {labels[tab]}
        </button>
    );
}

function OverviewTab({ test }: { test: TestDetail }) {
    const progress = getProgress(test);
    const scoreRate = getScoreRate(test);

    return (
        <div className="space-y-4">
            <Card className="p-5">
                <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-center">
                    <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                            {test.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                            {test.companies.map((company) => <Badge key={company} variant="blue">{company}</Badge>)}
                        </div>
                        <h3 className="text-xl font-black text-slate-950">테스트 소개</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-500">{test.description}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                        <p className="text-sm font-black text-slate-300">풀이 진행률</p>
                        <p className="mt-1 text-5xl font-black">{progress}%</p>
                        <ProgressBar value={progress} className="mt-5 bg-white/10" />
                    </div>
                </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-slate-950">응시 일정</h3>
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="grid gap-3">
                        <InfoRow label="시작" value={test.startAtText} />
                        <InfoRow label="마감" value={test.endAtText} />
                        <InfoRow label="제한 시간" value={`${test.durationMinutes}분`} />
                        <InfoRow label="상태" value={testStatusMeta[test.status].label} />
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-slate-950">점수 요약</h3>
                        <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                        <div className="mb-2 flex items-center justify-between text-sm font-black">
                            <span className="text-slate-600">내 점수율</span>
                            <span className="text-blue-600">{test.myScore === null ? "-" : `${scoreRate}%`}</span>
                        </div>
                        <ProgressBar value={scoreRate} barClassName={scoreRate >= 70 ? "bg-emerald-600" : scoreRate > 0 ? "bg-orange-500" : "bg-slate-300"} />
                    </div>
                    <div className="grid gap-3">
                        <InfoRow label="내 점수" value={test.myScore === null ? "-" : `${test.myScore} / ${test.totalScore}`} />
                        <InfoRow label="평균 점수" value={`${test.averageScore}`} />
                        <InfoRow label="내 순위" value={test.rank === null ? "-" : `#${test.rank}`} />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ProblemsTab({
                         filteredProblems,
                         keyword,
                         setKeyword,
                         difficulty,
                         setDifficulty,
                         status,
                         setStatus,
                         sort,
                         setSort,
                         viewMode,
                         setViewMode,
                         resetFilters
                     }: {
    filteredProblems: TestProblem[];
    keyword: string;
    setKeyword: (value: string) => void;
    difficulty: DifficultyFilter;
    setDifficulty: (value: DifficultyFilter) => void;
    status: ProblemStatusFilter;
    setStatus: (value: ProblemStatusFilter) => void;
    sort: SortOption;
    setSort: (value: SortOption) => void;
    viewMode: ViewMode;
    setViewMode: (value: ViewMode) => void;
    resetFilters: () => void;
}) {
    return (
        <div className="space-y-4">
            <FilterPanel
                title="테스트 문제 검색 / 필터"
                onReset={resetFilters}
                gridClassName="grid gap-3 xl:grid-cols-[1.4fr_160px_160px_190px_auto] xl:items-end"
            >
                <SearchInput value={keyword} onChange={setKeyword} placeholder="문제 번호, 제목, 태그, 메모, 추천 이유 검색" />
                <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
            </FilterPanel>

            <ListHeader
                title="테스트 문제 목록"
                description={`검색 조건에 맞는 문제 ${filteredProblems.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
            />

            {filteredProblems.length === 0 ? (
                <EmptyState
                    title="문제를 찾을 수 없습니다."
                    description="검색어 또는 필터 조건을 변경해보세요."
                    icon={Search}
                    onReset={resetFilters}
                />
            ) : viewMode === "card" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                    {filteredProblems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)}
                </div>
            ) : (
                <ProblemTable problems={filteredProblems} />
            )}
        </div>
    );
}

function RulesTab({ test }: { test: TestDetail }) {
    return (
        <div className="space-y-4">
            <GuideCard title="응시 규칙" icon={ShieldCheck} items={test.rules} />
            <GuideCard title="풀이 전략" icon={Lightbulb} items={test.guide} />
        </div>
    );
}

function AnalysisTab({ test }: { test: TestDetail }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {test.analysis.map((item) => (
                    <Card key={item.title} className="p-5">
                        <div className={`mb-4 inline-flex rounded-2xl px-3 py-2 text-sm font-black ${analysisToneClass[item.tone]}`}>{item.value}</div>
                        <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                    </Card>
                ))}
            </div>

            <Card className="p-5">
                <h3 className="text-xl font-black text-slate-950">문제별 상태</h3>
                <div className="mt-4 space-y-3">
                    {test.problems.map((problem) => (
                        <div key={problem.id} className="rounded-2xl bg-slate-50 p-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                <Link href={`/problems/${problem.id}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                    #{problem.id} {problem.title}
                                </Link>
                                <ProblemStatusBadge value={problem.status ?? "todo"} />
                            </div>
                            <p className="text-sm leading-6 text-slate-500">{problem.reason}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function GuideCard({ title, icon: Icon, items }: { title: string; icon: ComponentType<{ className?: string }>; items: string[] }) {
    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
            </div>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-600">{index + 1}</span>
                        {item}
                    </div>
                ))}
            </div>
        </Card>
    );
}

function ProblemTimeline({ problems }: { problems: TestProblem[] }) {
    return (
        <SidePanel title="문제 순서" badge={<ListChecks className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {problems.map((problem) => (
                    <Link key={problem.id} href={`/problems/${problem.id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${problem.status === "solved" ? "bg-emerald-100 text-emerald-700" : problem.status === "wrong" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-500"}`}>
                            {problem.order}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">{problem.title}</p>
                            <p className="mt-0.5 text-xs font-bold text-slate-400">{problem.points}점 · {problem.estimatedMinutes}분</p>
                        </div>
                        <ProblemStatusBadge value={problem.status ?? "todo"} />
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold">
            <span className="text-slate-400">{label}</span>
            <span className="break-all text-right text-slate-700">{value}</span>
        </div>
    );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <Link href={href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
          {label}
      </span>
            <ChevronRight className="h-4 w-4" />
        </Link>
    );
}

function NotFoundTest({ id }: { id: string }) {
    return (
        <AppShell title="테스트를 찾을 수 없습니다" description="요청한 테스트가 현재 로컬 데이터에 없습니다.">
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
        </AppShell>
    );
}

export default function TestDetailPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");
    const [test, setTest] = useState<TestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<DetailTab>("overview");
    const [keyword, setKeyword] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<ProblemStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("order");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

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
                    setTest(nextTest);
                }
            } catch (error) {
                if (!ignore) {
                    setTest(null);
                    console.error("Failed to load test detail", error);
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

    const filteredProblems = useMemo(() => {
        if (!test) return [];

        const lowerKeyword = keyword.trim().toLowerCase();

        const result = test.problems.filter((problem) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(problem.id).includes(lowerKeyword) ||
                problem.title.toLowerCase().includes(lowerKeyword) ||
                problem.category.toLowerCase().includes(lowerKeyword) ||
                problem.memo?.toLowerCase().includes(lowerKeyword) ||
                problem.reason.toLowerCase().includes(lowerKeyword) ||
                problem.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesDifficulty = difficulty === "전체" || problem.difficulty === difficulty;
            const matchesStatus = status === "전체" || problem.status === statusLabelToValue[status];

            return matchesKeyword && matchesDifficulty && matchesStatus;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "number-asc":
                    return a.id - b.id;
                case "difficulty":
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                case "score-desc":
                    return b.points - a.points;
                case "solved-rate":
                    return (b.solvedRate ?? 0) - (a.solvedRate ?? 0);
                case "status":
                    return statusOrder[a.status ?? "todo"] - statusOrder[b.status ?? "todo"];
                case "order":
                default:
                    return a.order - b.order;
            }
        });
    }, [test, keyword, difficulty, status, sort]);

    if (isLoading) {
        return (
            <AppShell title="테스트를 불러오는 중입니다" description="DB에서 테스트 상세 정보를 읽고 있습니다.">
                <Card className="p-6 text-sm font-bold text-slate-500">
                    테스트 데이터를 불러오는 중입니다.
                </Card>
            </AppShell>
        );
    }

    if (!test) {
        return <NotFoundTest id={id} />;
    }

    const solvedCount = getSolvedCount(test);
    const wrongCount = getWrongCount(test);
    const todoCount = test.problems.filter((problem) => problem.status === "todo").length;
    const progress = getProgress(test);
    const scoreRate = getScoreRate(test);
    const nextProblem = getNextProblem(test);
    const primaryHref = getPrimaryActionHref(test);

    const resetFilters = () => {
        setKeyword("");
        setDifficulty("전체");
        setStatus("전체");
        setSort("order");
    };

    return (
        <AppShell title={test.title} description={`${test.category} · ${test.difficulty} · ${test.durationMinutes}분`}>
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link href="/tests" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                모의 테스트
                            </Link>
                            <Badge variant="blue">Test</Badge>
                            <Badge>{test.category}</Badge>
                            <DifficultyBadge value={test.difficulty} />
                            <TestStatusBadge status={test.status} />
                            {test.featured && <Badge variant="amber"><Flame className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
                        </>
                    }
                    title={test.title}
                    description={test.description}
                    icon={Terminal}
                    rightTitle="내 점수율"
                    rightValue={test.myScore === null ? "-" : `${scoreRate}%`}
                    rightCaption={test.myScore === null ? `${test.totalScore}점 만점` : `${test.myScore} / ${test.totalScore}점`}
                    metrics={[
                        { label: "문제", value: `${test.problems.length}` },
                        { label: "시간", value: `${test.durationMinutes}분` },
                        { label: "참여", value: `${test.participants}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href={primaryHref} variant="primary" size="lg" iconRight={ArrowRight}>{getPrimaryActionLabel(test.status)}</AppLinkButton>
                            <AppLinkButton href="/tests" variant="white" size="lg" icon={Layers3}>다른 테스트 보기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="문제 수" value={test.problems.length.toLocaleString()} caption={`${test.totalScore}점 만점`} icon={BookOpen} tone="blue" />
                    <StatCard label="풀이 진행" value={`${progress}%`} caption={`${solvedCount} / ${test.problems.length} 해결`} icon={CheckCircle2} tone="green" />
                    <StatCard label="제한 시간" value={`${test.durationMinutes}분`} caption={`${test.startAtText} 시작`} icon={Timer} tone="orange" />
                    <StatCard label="오답" value={wrongCount.toLocaleString()} caption={`${todoCount}문제 미해결`} icon={RotateCcw} tone="red" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(["overview", "problems", "rules", "analysis"] as DetailTab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
                                ))}
                            </div>
                        </Card>

                        {activeTab === "overview" && <OverviewTab test={test} />}
                        {activeTab === "problems" && (
                            <ProblemsTab
                                filteredProblems={filteredProblems}
                                keyword={keyword}
                                setKeyword={setKeyword}
                                difficulty={difficulty}
                                setDifficulty={setDifficulty}
                                status={status}
                                setStatus={setStatus}
                                sort={sort}
                                setSort={setSort}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                resetFilters={resetFilters}
                            />
                        )}
                        {activeTab === "rules" && <RulesTab test={test} />}
                        {activeTab === "analysis" && <AnalysisTab test={test} />}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="응시 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">풀이 진행률</p>
                                <p className="mt-1 text-5xl font-black">{progress}%</p>
                                <ProgressBar value={progress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="해결" value={`${solvedCount}`} />
                                <MiniStat label="오답" value={`${wrongCount}`} />
                                <MiniStat label="남음" value={`${todoCount}`} />
                            </div>
                        </SidePanel>

                        <SidePanel title="점수 요약" badge={<Trophy className="h-5 w-5 text-amber-500" />}>
                            <div className="rounded-[1.5rem] bg-amber-50 p-5">
                                <p className="text-sm font-black text-amber-700">내 점수</p>
                                <p className="mt-1 text-4xl font-black text-amber-900">{test.myScore === null ? "-" : test.myScore}</p>
                                <p className="mt-1 text-sm font-bold text-amber-700">총점 {test.totalScore} · 평균 {test.averageScore}</p>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <MiniStat label="순위" value={test.rank === null ? "-" : `#${test.rank}`} />
                                <MiniStat label="점수율" value={test.myScore === null ? "-" : `${scoreRate}%`} />
                            </div>
                        </SidePanel>

                        <ProblemTimeline problems={test.problems} />

                        <SidePanel title="테스트 정보" badge={<FileText className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <InfoRow label="상태" value={testStatusMeta[test.status].label} />
                                <InfoRow label="시작" value={test.startAtText} />
                                <InfoRow label="마감" value={test.endAtText} />
                                <InfoRow label="참여자" value={`${test.participants.toLocaleString()}명`} />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {test.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href={primaryHref} label={getPrimaryActionLabel(test.status)} icon={Play} />
                                <QuickLink href={`/tests/${test.id}/solve`} label="풀이 화면" icon={Code2} />
                                <QuickLink href={`/tests/${test.id}/result`} label="결과 분석" icon={BarChart3} />
                                <QuickLink href={`/problems/${nextProblem.id}/solve`} label="추천 문제 풀기" icon={Target} />
                                <QuickLink href="/tests" label="모의 테스트 목록" icon={Terminal} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/tests/[id]`는 샘플 테스트 데이터 기반입니다. API는 `GET /api/tests/:id`, `GET /api/tests/:id/problems`, `POST /api/tests/:id/start`를 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
