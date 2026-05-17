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
import type { Difficulty } from "@/components/domain";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Database,
    FileCode2,
    Flame,
    Gauge,
    Layers3,
    ListChecks,
    Medal,
    NotebookPen,
    Play,
    RotateCcw,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    Terminal,
    Timer,
    Trophy,
    UsersRound,
    Zap
} from "lucide-react";

type TestCategory = "전체" | "입문" | "자료구조" | "그래프" | "DP" | "종합" | "기업형";
type TestStatus = "scheduled" | "open" | "completed" | "review";
type StatusFilter = "전체" | "예정" | "응시 가능" | "완료" | "복습" | "추천";
type DifficultyFilter = "전체" | Difficulty;
type SortOption = "recommended" | "recent" | "duration-asc" | "problem-desc" | "score-desc" | "deadline-asc";

type TestItem = {
    id: string;
    title: string;
    description: string;
    category: Exclude<TestCategory, "전체">;
    difficulty: Difficulty;
    status: TestStatus;
    recommended: boolean;
    featured: boolean;
    problemCount: number;
    solvedCount: number;
    totalScore: number;
    myScore: number | null;
    durationMinutes: number;
    participants: number;
    averageScore: number;
    startAt: string;
    startAtText: string;
    endAt: string;
    endAtText: string;
    updatedAt: string;
    tags: string[];
    companies: string[];
};

const tests: TestItem[] = [
    {
        id: "coding-test-practice-1",
        title: "실전 코딩테스트 1회차",
        description: "구현, 자료구조, 탐색, DP를 섞어 제한 시간 안에 푸는 실전형 모의 테스트입니다.",
        category: "종합",
        difficulty: "Medium",
        status: "open",
        recommended: true,
        featured: true,
        problemCount: 5,
        solvedCount: 2,
        totalScore: 500,
        myScore: 210,
        durationMinutes: 120,
        participants: 128,
        averageScore: 248,
        startAt: "2026-05-03T09:00:00",
        startAtText: "2026.05.03 09:00",
        endAt: "2026-05-10T23:59:00",
        endAtText: "2026.05.10 23:59",
        updatedAt: "2026-05-03",
        tags: ["구현", "BFS", "DP", "자료구조"],
        companies: ["공통", "신입", "주니어"]
    },
    {
        id: "beginner-basic-test",
        title: "입문 기본기 테스트",
        description: "입출력, 조건문, 반복문, 문자열 처리 중심의 기초 점검 테스트입니다.",
        category: "입문",
        difficulty: "Easy",
        status: "completed",
        recommended: false,
        featured: true,
        problemCount: 8,
        solvedCount: 8,
        totalScore: 400,
        myScore: 380,
        durationMinutes: 90,
        participants: 342,
        averageScore: 301,
        startAt: "2026-04-20T09:00:00",
        startAtText: "2026.04.20 09:00",
        endAt: "2026-04-30T23:59:00",
        endAtText: "2026.04.30 23:59",
        updatedAt: "2026-04-30",
        tags: ["입출력", "구현", "문자열"],
        companies: ["입문", "기초"]
    },
    {
        id: "bfs-graph-sprint",
        title: "BFS 그래프 스프린트",
        description: "격자 BFS, 다중 시작점 BFS, 최단 거리 문제를 집중적으로 푸는 테스트입니다.",
        category: "그래프",
        difficulty: "Medium",
        status: "open",
        recommended: true,
        featured: false,
        problemCount: 6,
        solvedCount: 3,
        totalScore: 600,
        myScore: 270,
        durationMinutes: 150,
        participants: 216,
        averageScore: 322,
        startAt: "2026-05-01T09:00:00",
        startAtText: "2026.05.01 09:00",
        endAt: "2026-05-08T23:59:00",
        endAtText: "2026.05.08 23:59",
        updatedAt: "2026-05-02",
        tags: ["BFS", "그래프", "큐", "격자"],
        companies: ["탐색", "그래프"]
    },
    {
        id: "dp-core-challenge",
        title: "DP 핵심 챌린지",
        description: "점화식 설계, LIS, 0/1 배낭을 포함한 DP 집중 테스트입니다.",
        category: "DP",
        difficulty: "Hard",
        status: "review",
        recommended: true,
        featured: true,
        problemCount: 5,
        solvedCount: 1,
        totalScore: 700,
        myScore: 120,
        durationMinutes: 180,
        participants: 94,
        averageScore: 218,
        startAt: "2026-04-25T09:00:00",
        startAtText: "2026.04.25 09:00",
        endAt: "2026-05-02T23:59:00",
        endAtText: "2026.05.02 23:59",
        updatedAt: "2026-05-02",
        tags: ["DP", "LIS", "Knapsack", "점화식"],
        companies: ["중급", "고난도"]
    },
    {
        id: "data-structure-midterm",
        title: "자료구조 중간 점검",
        description: "스택, 큐, 덱, 우선순위 큐, 해시를 점검하는 자료구조 테스트입니다.",
        category: "자료구조",
        difficulty: "Medium",
        status: "scheduled",
        recommended: false,
        featured: false,
        problemCount: 7,
        solvedCount: 0,
        totalScore: 600,
        myScore: null,
        durationMinutes: 120,
        participants: 0,
        averageScore: 0,
        startAt: "2026-05-12T20:00:00",
        startAtText: "2026.05.12 20:00",
        endAt: "2026-05-12T22:00:00",
        endAtText: "2026.05.12 22:00",
        updatedAt: "2026-05-01",
        tags: ["스택", "큐", "해시", "우선순위 큐"],
        companies: ["자료구조", "기본기"]
    },
    {
        id: "company-style-test-a",
        title: "기업형 코딩테스트 A형",
        description: "실제 기업 코딩테스트 형식처럼 난이도와 유형을 섞은 3문제 구성입니다.",
        category: "기업형",
        difficulty: "Hard",
        status: "scheduled",
        recommended: true,
        featured: false,
        problemCount: 3,
        solvedCount: 0,
        totalScore: 600,
        myScore: null,
        durationMinutes: 180,
        participants: 0,
        averageScore: 0,
        startAt: "2026-05-18T19:00:00",
        startAtText: "2026.05.18 19:00",
        endAt: "2026-05-18T22:00:00",
        endAtText: "2026.05.18 22:00",
        updatedAt: "2026-05-03",
        tags: ["구현", "그래프", "DP", "시뮬레이션"],
        companies: ["기업형", "실전", "3문제"]
    }
];

const DEFAULT_tests = tests;

const CATEGORY_OPTIONS: readonly TestCategory[] = ["전체", "입문", "자료구조", "그래프", "DP", "종합", "기업형"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly StatusFilter[] = ["전체", "예정", "응시 가능", "완료", "복습", "추천"];
const SORT_OPTIONS: readonly SortOption[] = ["recommended", "recent", "duration-asc", "problem-desc", "score-desc", "deadline-asc"];

const statusLabelToValue: Record<Exclude<StatusFilter, "전체" | "추천">, TestStatus> = {
    예정: "scheduled",
    "응시 가능": "open",
    완료: "completed",
    복습: "review"
};

const sortLabels: Record<SortOption, string> = {
    recommended: "추천순",
    recent: "최근 업데이트순",
    "duration-asc": "제한시간 짧은순",
    "problem-desc": "문제 수 많은순",
    "score-desc": "총점 높은순",
    "deadline-asc": "마감 임박순"
};

const difficultyVariant = {
    Easy: "green",
    Medium: "orange",
    Hard: "red"
} as const;

const statusMeta: Record<TestStatus, { label: string; variant: "default" | "blue" | "green" | "orange" | "red"; icon: ComponentType<{ className?: string }> }> = {
    scheduled: { label: "예정", variant: "default", icon: Clock3 },
    open: { label: "응시 가능", variant: "blue", icon: Play },
    completed: { label: "완료", variant: "green", icon: CheckCircle2 },
    review: { label: "복습", variant: "orange", icon: RotateCcw }
};

function getProgress(test: TestItem) {
    return Math.round((test.solvedCount / Math.max(test.problemCount, 1)) * 100);
}

function getScoreRate(test: TestItem) {
    if (test.myScore === null) return 0;
    return Math.round((test.myScore / Math.max(test.totalScore, 1)) * 100);
}

function getStatusButtonLabel(status: TestStatus) {
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
    const meta = statusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function TestCard({ test }: { test: TestItem }) {
    const progress = getProgress(test);
    const scoreRate = getScoreRate(test);

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={difficultyVariant[test.difficulty]}>{test.difficulty}</Badge>
                        <TestStatusBadge status={test.status} />
                        <Badge>{test.category}</Badge>
                        {test.recommended && <Badge variant="blue"><Star className="mr-1 h-3.5 w-3.5" />추천</Badge>}
                        {test.featured && <Badge variant="amber"><Flame className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
                    </div>

                    <Link href={`/tests/${test.id}`} className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                        {test.title}
                    </Link>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{test.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {test.tags.slice(0, 5).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="문제" value={`${test.problemCount}개`} />
                    <MetricBox label="제한" value={`${test.durationMinutes}분`} />
                    <MetricBox label="점수" value={test.myScore === null ? "-" : `${test.myScore}/${test.totalScore}`} />
                    <MetricBox label="참여" value={`${test.participants.toLocaleString()}명`} />
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm font-black">
                        <span className="text-slate-600">풀이 진행률</span>
                        <span className="text-blue-600">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} barClassName={test.status === "completed" ? "bg-emerald-600" : "bg-blue-600"} />
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm font-black">
                        <span className="text-slate-600">내 점수율</span>
                        <span className="text-blue-600">{test.myScore === null ? "-" : `${scoreRate}%`}</span>
                    </div>
                    <ProgressBar value={scoreRate} barClassName={scoreRate >= 70 ? "bg-emerald-600" : scoreRate > 0 ? "bg-orange-500" : "bg-slate-300"} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">
                    시작 {test.startAtText} · 마감 {test.endAtText}
                </div>
                <div className="flex flex-wrap gap-2">
                    <AppLinkButton href={`/tests/${test.id}`} variant="secondary" iconRight={ChevronRight}>상세 보기</AppLinkButton>
                    <AppLinkButton href={test.status === "completed" || test.status === "review" ? `/tests/${test.id}/result` : `/tests/${test.id}/solve`} variant="primary" iconRight={ArrowRight}>
                        {getStatusButtonLabel(test.status)}
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

function TestsTable({ items }: { items: TestItem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">테스트</th>
                        <th className="px-5 py-4">분류</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4 text-right">문제</th>
                        <th className="px-5 py-4 text-right">시간</th>
                        <th className="px-5 py-4 text-right">점수</th>
                        <th className="px-5 py-4 text-right">평균</th>
                        <th className="px-5 py-4">마감</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {items.map((test) => (
                        <tr key={test.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link href={`/tests/${test.id}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                    {test.title}
                                </Link>
                                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{test.description}</p>
                            </td>
                            <td className="px-5 py-4"><Badge>{test.category}</Badge></td>
                            <td className="px-5 py-4"><Badge variant={difficultyVariant[test.difficulty]}>{test.difficulty}</Badge></td>
                            <td className="px-5 py-4"><TestStatusBadge status={test.status} /></td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{test.problemCount}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{test.durationMinutes}분</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{test.myScore === null ? "-" : `${test.myScore}/${test.totalScore}`}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{test.averageScore}</td>
                            <td className="px-5 py-4 font-bold text-slate-500">{test.endAtText}</td>
                            <td className="px-5 py-4 text-right">
                                <AppLinkButton href={`/tests/${test.id}`} size="sm" iconRight={ChevronRight}>상세</AppLinkButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function FeaturedTestCard({ test }: { test: TestItem }) {
    const progress = getProgress(test);

    return (
        <Link href={`/tests/${test.id}`} className="block rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="amber">Featured</Badge>
                        <Badge variant={difficultyVariant[test.difficulty]}>{test.difficulty}</Badge>
                        <TestStatusBadge status={test.status} />
                    </div>
                    <h3 className="text-xl font-black text-slate-950">{test.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{test.description}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Terminal className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="문제" value={`${test.problemCount}`} />
                <MiniStat label="시간" value={`${test.durationMinutes}분`} />
                <MiniStat label="진행" value={`${progress}%`} />
            </div>
        </Link>
    );
}

function StatusDistributionPanel({ items }: { items: TestItem[] }) {
    const total = Math.max(items.length, 1);
    const statuses: TestStatus[] = ["open", "scheduled", "completed", "review"];

    return (
        <SidePanel title="상태별 테스트" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                {statuses.map((status) => {
                    const count = items.filter((item) => item.status === status).length;
                    const percent = Math.round((count / total) * 100);

                    return (
                        <div key={status}>
                            <div className="mb-2 flex items-center justify-between text-sm font-black">
                                <TestStatusBadge status={status} />
                                <span className="text-slate-500">{count}개</span>
                            </div>
                            <ProgressBar value={percent} />
                        </div>
                    );
                })}
            </div>
        </SidePanel>
    );
}

function CategoryPanel() {
    const categories = CATEGORY_OPTIONS.filter((category) => category !== "전체") as Exclude<TestCategory, "전체">[];

    return (
        <SidePanel title="분류별 테스트" badge={<Layers3 className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {categories.map((category) => {
                    const count = tests.filter((test) => test.category === category).length;

                    return (
                        <Link key={category} href={`/tests?category=${category}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                            {category}
                            <span className="text-slate-400">{count}개</span>
                        </Link>
                    );
                })}
            </div>
        </SidePanel>
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

export default function TestsPage() {
    const [tests, setTests] = useState<TestItem[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                const response = await fetch("/api/tests", { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const items = Array.isArray(data.tests) ? data.tests : [];
                if (ignore) return;

                setTests(items as TestItem[]);
            } catch (error) {
                console.error("Failed to load /api/tests", error);
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState<TestCategory>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<StatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recommended");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredTests = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = tests.filter((test) => {
            const matchesKeyword =
                !lowerKeyword ||
                test.title.toLowerCase().includes(lowerKeyword) ||
                test.description.toLowerCase().includes(lowerKeyword) ||
                test.category.toLowerCase().includes(lowerKeyword) ||
                test.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword)) ||
                test.companies.some((company) => company.toLowerCase().includes(lowerKeyword));

            const matchesCategory = category === "전체" || test.category === category;
            const matchesDifficulty = difficulty === "전체" || test.difficulty === difficulty;
            const matchesStatus =
                status === "전체" ||
                (status === "추천" ? test.recommended : test.status === statusLabelToValue[status]);

            return matchesKeyword && matchesCategory && matchesDifficulty && matchesStatus;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "recent":
                    return b.updatedAt.localeCompare(a.updatedAt);
                case "duration-asc":
                    return a.durationMinutes - b.durationMinutes;
                case "problem-desc":
                    return b.problemCount - a.problemCount;
                case "score-desc":
                    return b.totalScore - a.totalScore;
                case "deadline-asc":
                    return a.endAt.localeCompare(b.endAt);
                case "recommended":
                default:
                    return Number(b.recommended) - Number(a.recommended) || Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt);
            }
        });
    }, [keyword, category, difficulty, status, sort]);

    const openCount = tests.filter((test) => test.status === "open").length;
    const scheduledCount = tests.filter((test) => test.status === "scheduled").length;
    const completedCount = tests.filter((test) => test.status === "completed").length;
    const reviewCount = tests.filter((test) => test.status === "review").length;
    const totalProblems = tests.reduce((sum, test) => sum + test.problemCount, 0);
    const solvedProblems = tests.reduce((sum, test) => sum + test.solvedCount, 0);
    const totalScore = tests.reduce((sum, test) => sum + test.totalScore, 0);
    const myScore = tests.reduce((sum, test) => sum + (test.myScore ?? 0), 0);
    const scoreRate = Math.round((myScore / Math.max(totalScore, 1)) * 100);
    const featuredTests = tests.filter((test) => test.featured).slice(0, 3);

    const resetFilters = () => {
        setKeyword("");
        setCategory("전체");
        setDifficulty("전체");
        setStatus("전체");
        setSort("recommended");
    };

    return (
        <AppShell title="모의 테스트" description="코딩테스트 형식의 문제 묶음을 응시하고 결과를 확인합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Tests</Badge>
                            <Badge>Mock Coding Test</Badge>
                            <Badge variant="green">Open {openCount}</Badge>
                        </>
                    }
                    title="실전처럼 시간을 재고 문제를 풀어보세요."
                    description="문제 세트와 다르게 모의 테스트는 제한 시간, 점수, 결과 분석을 중심으로 구성됩니다. 응시 후 약점 태그와 오답을 복습할 수 있습니다."
                    icon={Terminal}
                    rightTitle="내 점수율"
                    rightValue={`${scoreRate}%`}
                    rightCaption={`${myScore} / ${totalScore}점`}
                    metrics={[
                        { label: "응시 가능", value: `${openCount}` },
                        { label: "예정", value: `${scheduledCount}` },
                        { label: "완료", value: `${completedCount}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href="/tests/coding-test-practice-1/solve" variant="primary" size="lg" iconRight={ArrowRight}>추천 테스트 응시</AppLinkButton>
                            <AppLinkButton href="/sets" variant="white" size="lg" icon={Layers3}>문제 세트 보기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 테스트" value={tests.length.toLocaleString()} caption={`응시 가능 ${openCount}개`} icon={Terminal} tone="blue" />
                    <StatCard label="전체 문제" value={totalProblems.toLocaleString()} caption={`${solvedProblems}문제 풀이`} icon={BookOpen} />
                    <StatCard label="내 점수" value={myScore.toLocaleString()} caption={`${scoreRate}% 달성`} icon={Trophy} tone="green" />
                    <StatCard label="복습 필요" value={reviewCount.toLocaleString()} caption="결과 분석 가능" icon={RotateCcw} tone="orange" />
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-slate-950">추천 테스트</h3>
                            <p className="mt-1 text-sm text-slate-500">현재 학습 흐름에서 먼저 응시하면 좋은 테스트입니다.</p>
                        </div>
                        <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                        {featuredTests.map((test) => <FeaturedTestCard key={test.id} test={test} />)}
                    </div>
                </section>

                <FilterPanel
                    title="테스트 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_190px_auto] xl:items-end"
                >
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="테스트명, 설명, 분류, 태그, 유형 검색" />
                    <FilterSelect label="분류" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
                    <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="테스트 목록"
                            description={`검색 조건에 맞는 테스트 ${filteredTests.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredTests.length === 0 ? (
                            <EmptyState
                                title="테스트를 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredTests.map((test) => <TestCard key={test.id} test={test} />)}
                            </div>
                        ) : (
                            <TestsTable items={filteredTests} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="응시 현황" badge={<BarChart3 className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">내 점수율</p>
                                <p className="mt-1 text-5xl font-black">{scoreRate}%</p>
                                <ProgressBar value={scoreRate} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="점수" value={`${myScore}`} />
                                <MiniStat label="총점" value={`${totalScore}`} />
                                <MiniStat label="완료" value={`${completedCount}`} />
                            </div>
                        </SidePanel>

                        <StatusDistributionPanel items={tests} />
                        <CategoryPanel />

                        <SidePanel title="추천 행동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/tests/coding-test-practice-1/solve" label="추천 테스트 응시" icon={Play} />
                                <QuickLink href="/tests/dp-core-challenge/result" label="DP 결과 복습" icon={RotateCcw} />
                                <QuickLink href="/notes" label="오답노트 정리" icon={NotebookPen} />
                                <QuickLink href="/ranking" label="랭킹 확인" icon={Medal} />
                                <QuickLink href="/goals" label="학습 목표" icon={Target} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 화면은 DB API 응답만 사용합니다. 데이터가 없으면 목업 대신 빈 상태가 표시됩니다.</Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
