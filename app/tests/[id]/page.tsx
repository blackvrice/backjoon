"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
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
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Database,
    FileText,
    Flame,
    Gauge,
    Layers3,
    Lightbulb,
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

const TESTS: TestDetail[] = [
    {
        id: "coding-test-practice-1",
        title: "실전 코딩테스트 1회차",
        description: "구현, 자료구조, 탐색, DP를 섞어 제한 시간 안에 푸는 실전형 모의 테스트입니다.",
        category: "종합",
        difficulty: "Medium",
        status: "open",
        recommended: true,
        featured: true,
        totalScore: 500,
        myScore: 210,
        durationMinutes: 120,
        participants: 128,
        averageScore: 248,
        rank: 42,
        startAt: "2026-05-03T09:00:00",
        startAtText: "2026.05.03 09:00",
        endAt: "2026-05-10T23:59:00",
        endAtText: "2026.05.10 23:59",
        updatedAt: "2026-05-03",
        tags: ["구현", "BFS", "DP", "자료구조"],
        companies: ["공통", "신입", "주니어"],
        rules: [
            "제한 시간은 120분이며, 테스트 시작 후 중단해도 시간이 계속 흐릅니다.",
            "문제별 부분 점수는 없으며, 각 문제는 모든 테스트 케이스를 통과해야 점수가 반영됩니다.",
            "제출 횟수 제한은 없지만, 마지막 정답 제출 기준으로 점수가 확정됩니다.",
            "실제 시험 모드에서는 외부 검색과 복사 붙여넣기 제한을 옵션으로 둘 수 있습니다."
        ],
        guide: [
            "먼저 모든 문제를 훑고 쉬운 구현 문제부터 해결하세요.",
            "BFS 문제는 방문 처리 시점을 큐에 넣는 순간으로 통일하세요.",
            "DP 문제는 점화식보다 상태 정의를 먼저 작성하세요.",
            "남은 20분에는 오답 문제보다 아직 시도하지 않은 쉬운 문제를 우선하세요."
        ],
        analysis: [
            { title: "현재 점수", description: "획득한 점수입니다.", value: "210 / 500", tone: "blue" },
            { title: "평균 대비", description: "현재 평균보다 낮습니다.", value: "-38점", tone: "orange" },
            { title: "약점 태그", description: "오답이 많이 발생한 태그입니다.", value: "DP", tone: "red" },
            { title: "추천 행동", description: "BFS 문제를 먼저 마무리하세요.", value: "토마토", tone: "green" }
        ],
        problems: [
            {
                order: 1,
                id: 1000,
                title: "두 수의 합",
                difficulty: "Easy",
                category: "구현",
                score: 100,
                points: 80,
                status: "solved",
                solvedRate: 69.5,
                submissions: 184,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["implementation", "math", "입출력"],
                memo: "기본 입출력과 사칙연산을 확인하는 입문 문제입니다.",
                recommendedOrder: 1,
                required: true,
                estimatedMinutes: 10,
                reason: "가장 쉬운 워밍업 문제입니다."
            },
            {
                order: 2,
                id: 10828,
                title: "스택 명령 처리",
                difficulty: "Medium",
                category: "자료구조",
                score: 150,
                points: 100,
                status: "solved",
                solvedRate: 60.5,
                submissions: 119,
                timeLimit: "2초",
                memoryLimit: "512MB",
                tags: ["stack", "data-structure", "자료구조"],
                memo: "스택 명령 처리와 입출력 최적화를 연습합니다.",
                recommendedOrder: 2,
                required: true,
                estimatedMinutes: 20,
                reason: "자료구조 기본 구현력을 확인합니다."
            },
            {
                order: 3,
                id: 7576,
                title: "토마토",
                difficulty: "Medium",
                category: "그래프",
                score: 180,
                points: 120,
                status: "wrong",
                solvedRate: 45.8,
                submissions: 96,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["bfs", "queue", "graph"],
                memo: "다중 시작점 BFS입니다. 모든 익은 토마토를 큐에 넣어야 합니다.",
                recommendedOrder: 3,
                required: true,
                estimatedMinutes: 30,
                reason: "다중 시작점 BFS를 점검합니다."
            },
            {
                order: 4,
                id: 12865,
                title: "평범한 배낭",
                difficulty: "Hard",
                category: "DP",
                score: 200,
                points: 120,
                status: "wrong",
                solvedRate: 38.1,
                submissions: 76,
                timeLimit: "2초",
                memoryLimit: "512MB",
                tags: ["dp", "knapsack"],
                memo: "1차원 DP는 무게를 뒤에서 앞으로 갱신해야 합니다.",
                recommendedOrder: 4,
                required: true,
                estimatedMinutes: 40,
                reason: "고득점 변별 문제입니다."
            },
            {
                order: 5,
                id: 2178,
                title: "미로 탐색",
                difficulty: "Medium",
                category: "그래프",
                score: 150,
                points: 80,
                status: "todo",
                solvedRate: 44.7,
                submissions: 115,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["bfs", "graph", "grid"],
                memo: "격자 BFS의 기본 문제입니다.",
                recommendedOrder: 5,
                required: false,
                estimatedMinutes: 20,
                reason: "남은 시간에 시도하기 좋은 그래프 문제입니다."
            }
        ]
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
        totalScore: 700,
        myScore: 120,
        durationMinutes: 180,
        participants: 94,
        averageScore: 218,
        rank: 67,
        startAt: "2026-04-25T09:00:00",
        startAtText: "2026.04.25 09:00",
        endAt: "2026-05-02T23:59:00",
        endAtText: "2026.05.02 23:59",
        updatedAt: "2026-05-02",
        tags: ["DP", "LIS", "Knapsack", "점화식"],
        companies: ["중급", "고난도"],
        rules: [
            "총 5문제이며 제한 시간은 180분입니다.",
            "점수는 문제별 난이도에 따라 다르게 배정됩니다.",
            "복습 모드에서는 풀이 기록과 실패 케이스를 함께 확인할 수 있습니다."
        ],
        guide: [
            "각 문제마다 dp 배열의 의미를 먼저 적으세요.",
            "기저 상태와 배열 범위를 먼저 확인하세요.",
            "1차원 DP 최적화는 갱신 방향을 반드시 검토하세요."
        ],
        analysis: [
            { title: "현재 점수", description: "획득한 점수입니다.", value: "120 / 700", tone: "red" },
            { title: "평균 대비", description: "평균보다 낮습니다.", value: "-98점", tone: "orange" },
            { title: "약점 태그", description: "가장 많이 틀린 유형입니다.", value: "Knapsack", tone: "red" },
            { title: "추천 행동", description: "1차원 DP 갱신 방향을 복습하세요.", value: "배낭", tone: "blue" }
        ],
        problems: [
            {
                order: 1,
                id: 1463,
                title: "1로 만들기",
                difficulty: "Medium",
                category: "DP",
                score: 140,
                points: 120,
                status: "todo",
                solvedRate: 49.5,
                submissions: 178,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["dp", "dynamic-programming"],
                memo: "dp[i]를 i를 1로 만드는 최소 연산 수로 정의합니다.",
                recommendedOrder: 1,
                required: true,
                estimatedMinutes: 25,
                reason: "기본 점화식 설계 문제입니다."
            },
            {
                order: 2,
                id: 11053,
                title: "가장 긴 증가하는 부분 수열",
                difficulty: "Medium",
                category: "DP",
                score: 150,
                points: 140,
                status: "solved",
                solvedRate: 63.3,
                submissions: 101,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["dp", "lis", "binary-search"],
                memo: "O(N²) DP와 O(N log N) 풀이를 모두 연습할 수 있습니다.",
                recommendedOrder: 2,
                required: true,
                estimatedMinutes: 30,
                reason: "부분 수열 DP의 대표 문제입니다."
            },
            {
                order: 3,
                id: 12865,
                title: "평범한 배낭",
                difficulty: "Hard",
                category: "DP",
                score: 200,
                points: 180,
                status: "wrong",
                solvedRate: 38.1,
                submissions: 76,
                timeLimit: "2초",
                memoryLimit: "512MB",
                tags: ["dp", "knapsack"],
                memo: "1차원 DP는 무게를 뒤에서 앞으로 갱신해야 합니다.",
                recommendedOrder: 3,
                required: true,
                estimatedMinutes: 45,
                reason: "0/1 배낭 대표 문제입니다."
            }
        ]
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
        totalScore: 400,
        myScore: 380,
        durationMinutes: 90,
        participants: 342,
        averageScore: 301,
        rank: 18,
        startAt: "2026-04-20T09:00:00",
        startAtText: "2026.04.20 09:00",
        endAt: "2026-04-30T23:59:00",
        endAtText: "2026.04.30 23:59",
        updatedAt: "2026-04-30",
        tags: ["입출력", "구현", "문자열"],
        companies: ["입문", "기초"],
        rules: ["총 8문제이며 제한 시간은 90분입니다.", "기초 문법과 입출력 형식을 확인합니다."],
        guide: ["출력 형식을 꼼꼼히 확인하세요.", "반복문 범위와 인덱스 실수를 줄이세요."],
        analysis: [
            { title: "현재 점수", description: "획득한 점수입니다.", value: "380 / 400", tone: "green" },
            { title: "평균 대비", description: "평균보다 높습니다.", value: "+79점", tone: "green" },
            { title: "강점 태그", description: "높은 정답률을 보인 태그입니다.", value: "구현", tone: "blue" },
            { title: "추천 행동", description: "다음 단계로 BFS를 추천합니다.", value: "BFS", tone: "orange" }
        ],
        problems: [
            {
                order: 1,
                id: 1000,
                title: "두 수의 합",
                difficulty: "Easy",
                category: "구현",
                score: 100,
                points: 50,
                status: "solved",
                solvedRate: 69.5,
                submissions: 184,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["implementation", "math", "입출력"],
                memo: "기본 입출력과 사칙연산을 확인하는 입문 문제입니다.",
                recommendedOrder: 1,
                required: true,
                estimatedMinutes: 5,
                reason: "기본 입출력 확인용 문제입니다."
            },
            {
                order: 2,
                id: 2675,
                title: "문자열 반복",
                difficulty: "Easy",
                category: "문자열",
                score: 100,
                points: 60,
                status: "solved",
                solvedRate: 66.2,
                submissions: 128,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["string", "implementation"],
                memo: "문자 단위 반복 출력 문제입니다.",
                recommendedOrder: 2,
                required: true,
                estimatedMinutes: 10,
                reason: "문자열 반복 출력 형식 연습에 좋습니다."
            }
        ]
    }
];

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

function getTest(id: string) {
    return TESTS.find((test) => test.id === id);
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
                         test,
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
    test: TestDetail;
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
    const test = getTest(id);

    const [activeTab, setActiveTab] = useState<DetailTab>("overview");
    const [keyword, setKeyword] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<ProblemStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("order");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

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
                                test={test}
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
