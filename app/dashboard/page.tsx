"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AppShell from "@/components/layout/AppShell";
import {
    AppLinkButton,
    Badge,
    Card,
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
    SubmissionStatusBadge,
    type Difficulty,
    type ProblemStatus,
    type SubmissionStatus
} from "@/components/domain";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Flame,
    Gauge,
    Hash,
    History,
    Layers3,
    ListChecks,
    Medal,
    NotebookPen,
    Play,
    RotateCcw,
    Settings,
    Sparkles,
    Target,
    Terminal,
    Timer,
    Trophy,
    Zap
} from "lucide-react";

type DashboardRange = "today" | "week" | "month";
type TodoIconKey = "rotate" | "note" | "hash" | "trophy" | "target" | "book" | "history" | "play";

type DashboardStats = {
    solvedToday: number;
    solvedWeek: number;
    solvedMonth: number;
    totalSolved: number;
    submissionsToday: number;
    acceptedToday: number;
    accuracy: number;
    streakDays: number;
    rank: number;
    score: number;
    targetSolvedWeek: number;
    targetStudyMinutes: number;
    studyMinutesToday: number;
};

type TodoItem = {
    id: string;
    title: string;
    description: string;
    href: string;
    status: "todo" | "doing" | "done";
    priority: "low" | "medium" | "high";
    icon: TodoIconKey;
};

type RecentSubmission = {
    id: number;
    problemId: number;
    problemTitle: string;
    status: SubmissionStatus;
    language: string;
    submittedAt: string;
    time: string;
    memory: string;
};

type RecommendedProblem = {
    id: number;
    title: string;
    difficulty: Difficulty;
    status: ProblemStatus;
    tags: string[];
    reason: string;
    score: number;
    solvedRate: number;
};

type WeakTag = {
    slug: string;
    name: string;
    accuracy: number;
    wrongCount: number;
    reviewCount: number;
    description: string;
};

type StudyActivity = {
    day: string;
    solved: number;
    submissions: number;
    minutes: number;
};

type UpcomingTest = {
    id: string;
    title: string;
    status: "open" | "scheduled" | "review";
    difficulty: Difficulty;
    durationMinutes: number;
    endAtText: string;
    progress: number;
};

type DashboardData = {
    stats: DashboardStats;
    todoItems: TodoItem[];
    recentSubmissions: RecentSubmission[];
    recommendedProblems: RecommendedProblem[];
    weakTags: WeakTag[];
    weeklyActivity: StudyActivity[];
    upcomingTests: UpcomingTest[];
};

const emptyStats: DashboardStats = {
    solvedToday: 0,
    solvedWeek: 0,
    solvedMonth: 0,
    totalSolved: 0,
    submissionsToday: 0,
    acceptedToday: 0,
    accuracy: 0,
    streakDays: 0,
    rank: 0,
    score: 0,
    targetSolvedWeek: 25,
    targetStudyMinutes: 90,
    studyMinutesToday: 0
};

const initialDashboardData: DashboardData = {
    stats: emptyStats,
    todoItems: [],
    recentSubmissions: [],
    recommendedProblems: [],
    weakTags: [],
    weeklyActivity: [],
    upcomingTests: []
};

const rangeLabels: Record<DashboardRange, string> = {
    today: "오늘",
    week: "이번 주",
    month: "이번 달"
};

const todoIconMap: Record<TodoIconKey, ComponentType<{ className?: string }>> = {
    rotate: RotateCcw,
    note: NotebookPen,
    hash: Hash,
    trophy: Trophy,
    target: Target,
    book: BookOpen,
    history: History,
    play: Play
};

const priorityMeta: Record<TodoItem["priority"], { label: string; variant: "default" | "blue" | "orange" | "red" }> = {
    low: { label: "낮음", variant: "default" },
    medium: { label: "보통", variant: "orange" },
    high: { label: "중요", variant: "red" }
};

const todoStatusMeta: Record<TodoItem["status"], { label: string; variant: "default" | "blue" | "green" }> = {
    todo: { label: "예정", variant: "default" },
    doing: { label: "진행 중", variant: "blue" },
    done: { label: "완료", variant: "green" }
};

const testStatusMeta: Record<UpcomingTest["status"], { label: string; variant: "default" | "blue" | "orange" }> = {
    open: { label: "응시 가능", variant: "blue" },
    scheduled: { label: "예정", variant: "default" },
    review: { label: "복습", variant: "orange" }
};

function RangeToggle({ value, onChange }: { value: DashboardRange; onChange: (value: DashboardRange) => void }) {
    return (
        <div className="flex rounded-2xl bg-slate-100 p-1">
            {(["today", "week", "month"] as DashboardRange[]).map((range) => (
                <button
                    key={range}
                    type="button"
                    onClick={() => onChange(range)}
                    className={`rounded-xl px-3 py-2 text-sm font-black transition ${value === range ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950"}`}
                >
                    {rangeLabels[range]}
                </button>
            ))}
        </div>
    );
}

function TodoCard({ item }: { item: TodoItem }) {
    const Icon = todoIconMap[item.icon] ?? ListChecks;
    const priority = priorityMeta[item.priority];
    const status = todoStatusMeta[item.status];

    return (
        <Link href={item.href} className="block rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                    </div>
                    <p className="font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
        </Link>
    );
}

function RecentSubmissionRow({ submission }: { submission: RecentSubmission }) {
    return (
        <Link href={`/submissions/${submission.id}`} className="grid gap-3 rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50 xl:grid-cols-[1fr_120px_90px] xl:items-center">
            <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                    <SubmissionStatusBadge value={submission.status} />
                    <Badge variant="blue">{submission.language}</Badge>
                </div>
                <p className="truncate font-black text-slate-950">{submission.problemId}. {submission.problemTitle}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">#{submission.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-bold text-slate-500 xl:block xl:text-right">
                <p>{submission.time}</p>
                <p>{submission.memory}</p>
            </div>
            <div className="text-sm font-black text-slate-400 xl:text-right">{submission.submittedAt}</div>
        </Link>
    );
}

function RecommendedProblemCard({ problem }: { problem: RecommendedProblem }) {
    return (
        <Card hover className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <DifficultyBadge value={problem.difficulty} />
                <ProblemStatusBadge value={problem.status} />
                <Badge>{problem.score}점</Badge>
                <Badge>{problem.solvedRate}%</Badge>
            </div>

            <Link href={`/problems/${problem.id}`} className="text-xl font-black text-slate-950 transition hover:text-blue-600">
                {problem.id}. {problem.title}
            </Link>
            <p className="mt-3 text-sm leading-7 text-slate-500">{problem.reason}</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {problem.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                <AppLinkButton href={`/problems/${problem.id}/solve`} variant="primary" iconRight={ArrowRight}>풀기</AppLinkButton>
            </div>
        </Card>
    );
}

function ActivityChart({ items }: { items: StudyActivity[] }) {
    const maxSolved = Math.max(...items.map((item) => item.solved), 1);

    return (
        <Card className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-black text-slate-950">주간 활동</h3>
                    <p className="mt-1 text-sm text-slate-500">요일별 해결 문제 수와 학습 시간을 확인합니다.</p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>

            <div className="grid h-56 grid-cols-7 items-end gap-3">
                {items.map((item) => {
                    const height = Math.max(8, Math.round((item.solved / maxSolved) * 100));
                    return (
                        <div key={item.day} className="flex h-full flex-col items-center justify-end gap-2">
                            <div className="flex h-full w-full items-end rounded-2xl bg-slate-50 p-1">
                                <div className="w-full rounded-xl bg-blue-600" style={{ height: `${height}%` }} />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-slate-950">{item.day}</p>
                                <p className="text-[11px] font-bold text-slate-400">{item.solved}문제</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function WeakTagCard({ tag }: { tag: WeakTag }) {
    return (
        <Link href={`/tags/${tag.slug}`} className="block rounded-2xl bg-rose-50 p-4 transition hover:bg-rose-100">
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-black text-rose-900">#{tag.name}</span>
                <Badge variant="red">{tag.accuracy}%</Badge>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-rose-700">{tag.description}</p>
            <div className="mt-3">
                <ProgressBar value={tag.accuracy} barClassName={tag.accuracy < 50 ? "bg-rose-600" : "bg-orange-500"} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <MiniStat label="오답" value={`${tag.wrongCount}`} />
                <MiniStat label="복습" value={`${tag.reviewCount}`} />
            </div>
        </Link>
    );
}

function UpcomingTestCard({ test }: { test: UpcomingTest }) {
    const meta = testStatusMeta[test.status];
    const href = test.status === "review" ? `/tests/${test.id}/result` : `/tests/${test.id}`;

    return (
        <Link href={href} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
            <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <DifficultyBadge value={test.difficulty} />
                <Badge>{test.durationMinutes}분</Badge>
            </div>
            <p className="font-black text-slate-950">{test.title}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">마감 {test.endAtText}</p>
            <div className="mt-3">
                <ProgressBar value={test.progress} />
            </div>
        </Link>
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

function EmptyPanel({ message }: { message: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold leading-7 text-slate-500">
            {message}
        </div>
    );
}

export default function DashboardPage() {
    const [range, setRange] = useState<DashboardRange>("week");
    const [dashboard, setDashboard] = useState<DashboardData>(initialDashboardData);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadDashboard() {
            try {
                setIsLoading(true);
                setErrorMessage(null);

                const response = await fetch("/api/dashboard", {
                    cache: "no-store"
                });

                if (!response.ok) {
                    throw new Error("대시보드 데이터를 불러오지 못했습니다.");
                }

                const data = (await response.json()) as Partial<DashboardData>;

                if (!mounted) return;

                setDashboard({
                    stats: { ...emptyStats, ...(data.stats ?? {}) },
                    todoItems: data.todoItems ?? [],
                    recentSubmissions: data.recentSubmissions ?? [],
                    recommendedProblems: data.recommendedProblems ?? [],
                    weakTags: data.weakTags ?? [],
                    weeklyActivity: data.weeklyActivity ?? [],
                    upcomingTests: data.upcomingTests ?? []
                });
            } catch (error) {
                if (!mounted) return;
                setDashboard(initialDashboardData);
                setErrorMessage(error instanceof Error ? error.message : "대시보드 데이터를 불러오지 못했습니다.");
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    const stats = dashboard.stats;
    const todoItems = dashboard.todoItems;
    const recentSubmissions = dashboard.recentSubmissions;
    const recommendedProblems = dashboard.recommendedProblems;
    const weakTags = dashboard.weakTags;
    const weeklyActivity = dashboard.weeklyActivity;
    const upcomingTests = dashboard.upcomingTests;

    const selectedSolved = useMemo(() => {
        if (range === "today") return stats.solvedToday;
        if (range === "month") return stats.solvedMonth;
        return stats.solvedWeek;
    }, [range, stats.solvedMonth, stats.solvedToday, stats.solvedWeek]);

    const weeklyProgress = Math.min(100, Math.round((stats.solvedWeek / Math.max(stats.targetSolvedWeek, 1)) * 100));
    const todayStudyProgress = Math.min(100, Math.round((stats.studyMinutesToday / Math.max(stats.targetStudyMinutes, 1)) * 100));
    const acceptedRateToday = Math.round((stats.acceptedToday / Math.max(stats.submissionsToday, 1)) * 100);

    return (
        <AppShell title="대시보드" description="오늘의 풀이 현황, 추천 문제, 오답과 테스트 일정을 확인합니다.">
            <div className="space-y-6">
                {errorMessage && (
                    <Notice title="DB 연결 오류" variant="warning">
                        {errorMessage}
                    </Notice>
                )}

                {isLoading && (
                    <Notice title="데이터 로딩 중" variant="info">
                        PostgreSQL 대시보드 데이터를 불러오는 중입니다.
                    </Notice>
                )}

                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Dashboard</Badge>
                            <Badge>Local Judge</Badge>
                            <Badge variant="green">Streak {stats.streakDays}일</Badge>
                        </>
                    }
                    title="오늘의 코딩 테스트 학습을 이어가세요."
                    description="풀이 기록, 오답, 약점 태그, 모의 테스트 현황을 한 화면에서 확인하고 바로 다음 문제로 이어갈 수 있습니다."
                    icon={Gauge}
                    rightTitle={`${rangeLabels[range]} 해결`}
                    rightValue={`${selectedSolved}`}
                    rightCaption={`전체 해결 ${stats.totalSolved}문제 · 랭킹 ${stats.rank > 0 ? `#${stats.rank}` : "-"}`}
                    metrics={[
                        { label: "점수", value: `${stats.score}` },
                        { label: "정답률", value: `${stats.accuracy}%` },
                        { label: "연속", value: `${stats.streakDays}일` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href="/problems" variant="primary" size="lg" iconRight={ArrowRight}>문제 풀기</AppLinkButton>
                            <AppLinkButton href={upcomingTests[0] ? `/tests/${upcomingTests[0].id}/solve` : "/tests"} variant="white" size="lg" icon={Play}>모의 테스트</AppLinkButton>
                        </>
                    }
                />

                <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-950">학습 요약</h2>
                        <p className="mt-1 text-sm text-slate-500">기간을 바꾸면 상단 해결 수가 함께 바뀝니다.</p>
                    </div>
                    <RangeToggle value={range} onChange={setRange} />
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="오늘 해결" value={stats.solvedToday.toLocaleString()} caption={`제출 ${stats.submissionsToday}회 · AC ${acceptedRateToday}%`} icon={CheckCircle2} tone="green" />
                    <StatCard label="이번 주 해결" value={stats.solvedWeek.toLocaleString()} caption={`목표 ${stats.targetSolvedWeek}문제 중 ${weeklyProgress}%`} icon={Target} tone="blue" />
                    <StatCard label="학습 시간" value={`${stats.studyMinutesToday}분`} caption={`오늘 목표 ${todayStudyProgress}%`} icon={Timer} tone="orange" />
                    <StatCard label="랭킹" value={stats.rank > 0 ? `#${stats.rank}` : "-"} caption={`${stats.score}점 · ${stats.streakDays}일 연속`} icon={Medal} tone="purple" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-6">
                        <section className="grid gap-4 xl:grid-cols-2">
                            <Card className="p-5">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-950">오늘 할 일</h3>
                                        <p className="mt-1 text-sm text-slate-500">학습 흐름을 끊지 않도록 다음 작업을 정리했습니다.</p>
                                    </div>
                                    <ListChecks className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    {todoItems.length > 0 ? (
                                        todoItems.map((item) => <TodoCard key={item.id} item={item} />)
                                    ) : (
                                        <EmptyPanel message="DB에 생성된 오늘 할 일이 없습니다. 제출 기록이나 오답 데이터가 쌓이면 자동으로 표시됩니다." />
                                    )}
                                </div>
                            </Card>

                            <ActivityChart items={weeklyActivity} />
                        </section>

                        <section>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-black text-slate-950">추천 문제</h3>
                                    <p className="mt-1 text-sm text-slate-500">최근 오답과 약점 태그를 기준으로 추천합니다.</p>
                                </div>
                                <Sparkles className="h-6 w-6 text-blue-600" />
                            </div>
                            {recommendedProblems.length > 0 ? (
                                <div className="grid gap-4 xl:grid-cols-3">
                                    {recommendedProblems.map((problem) => <RecommendedProblemCard key={problem.id} problem={problem} />)}
                                </div>
                            ) : (
                                <Card className="p-5">
                                    <EmptyPanel message="추천할 문제가 없습니다. Problem 테이블에 문제가 등록되면 이 영역에 표시됩니다." />
                                </Card>
                            )}
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
                            <Card className="p-5">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-950">최근 제출</h3>
                                        <p className="mt-1 text-sm text-slate-500">최근 제출 결과를 바로 확인하고 복습할 수 있습니다.</p>
                                    </div>
                                    <History className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="space-y-3">
                                    {recentSubmissions.length > 0 ? (
                                        recentSubmissions.map((submission) => <RecentSubmissionRow key={submission.id} submission={submission} />)
                                    ) : (
                                        <EmptyPanel message="아직 제출 기록이 없습니다. 문제를 제출하면 최근 제출 목록에 표시됩니다." />
                                    )}
                                </div>
                                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                                    <AppLinkButton href="/submissions" variant="secondary" iconRight={ChevronRight}>전체 제출 보기</AppLinkButton>
                                </div>
                            </Card>

                            <Card className="p-5">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-950">약점 태그</h3>
                                        <p className="mt-1 text-sm text-slate-500">정답률이 낮거나 오답이 많은 태그입니다.</p>
                                    </div>
                                    <Flame className="h-6 w-6 text-rose-600" />
                                </div>
                                <div className="space-y-3">
                                    {weakTags.length > 0 ? (
                                        weakTags.map((tag) => <WeakTagCard key={tag.slug} tag={tag} />)
                                    ) : (
                                        <EmptyPanel message="약점 태그 데이터가 없습니다. 태그와 제출 데이터가 쌓이면 자동 계산됩니다." />
                                    )}
                                </div>
                            </Card>
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="오늘 목표" badge={<Target className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">학습 시간</p>
                                <p className="mt-1 text-5xl font-black">{todayStudyProgress}%</p>
                                <ProgressBar value={todayStudyProgress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="학습" value={`${stats.studyMinutesToday}분`} />
                                <MiniStat label="목표" value={`${stats.targetStudyMinutes}분`} />
                                <MiniStat label="해결" value={`${stats.solvedToday}`} />
                            </div>
                        </SidePanel>

                        <SidePanel title="이번 주 목표" badge={<CalendarDays className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-blue-50 p-5">
                                <p className="text-sm font-black text-blue-700">문제 해결 목표</p>
                                <p className="mt-1 text-4xl font-black text-blue-950">{stats.solvedWeek}/{stats.targetSolvedWeek}</p>
                                <ProgressBar value={weeklyProgress} className="mt-5" />
                            </div>
                            <Notice variant="info" title="추천">
                                이번 주 목표까지 {Math.max(stats.targetSolvedWeek - stats.solvedWeek, 0)}문제 남았습니다.
                            </Notice>
                        </SidePanel>

                        <SidePanel title="모의 테스트" badge={<Terminal className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-3">
                                {upcomingTests.length > 0 ? (
                                    upcomingTests.map((test) => <UpcomingTestCard key={test.id} test={test} />)
                                ) : (
                                    <EmptyPanel message="등록된 모의 테스트가 없습니다." />
                                )}
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/problems" label="전체 문제" icon={BookOpen} />
                                <QuickLink href="/sets" label="문제 세트" icon={Layers3} />
                                <QuickLink href="/tests" label="모의 테스트" icon={Terminal} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/ranking" label="랭킹" icon={Trophy} />
                                <QuickLink href="/settings" label="설정" icon={Settings} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결" variant="info">
                            이 화면은 GET /api/dashboard에서 PostgreSQL 데이터를 받아 표시합니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
