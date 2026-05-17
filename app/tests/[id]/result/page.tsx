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
    ProblemStatusBadge,
    SubmissionStatusBadge,
    type Difficulty,
    type ProblemStatus,
    type SubmissionStatus
} from "@/components/domain";
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
    Database,
    FileCode2,
    Flame,
    Gauge,
    Hash,
    Layers3,
    ListChecks,
    Medal,
    NotebookPen,
    Play,
    RotateCcw,
    Search,
    Sparkles,
    Star,
    Target,
    Terminal,
    Timer,
    Trophy,
    UsersRound,
    XCircle,
    Zap
} from "lucide-react";

type ResultTab = "summary" | "problems" | "submissions" | "weakness";
type ResultGrade = "S" | "A" | "B" | "C" | "D";
type DifficultyFilter = "전체" | Difficulty;
type ProblemStatusFilter = "전체" | "해결" | "오답" | "미해결" | "복습";
type SortOption = "order" | "score-desc" | "score-asc" | "difficulty" | "status" | "accuracy-asc";

type ResultProblem = {
    id: number;
    order: number;
    title: string;
    difficulty: Difficulty;
    status: ProblemStatus;
    points: number;
    earned: number;
    attempts: number;
    solvedRate: number;
    timeSpentMinutes: number;
    tags: string[];
    note: string;
    lastSubmissionId?: number;
};

type ResultSubmission = {
    id: number;
    problemId: number;
    problemTitle: string;
    status: SubmissionStatus;
    language: string;
    time: string;
    memory: string;
    submittedAt: string;
    codeLength: string;
};

type WeakTag = {
    tag: string;
    accuracy: number;
    wrongCount: number;
    reviewCount: number;
    description: string;
    href: string;
};

type TestResult = {
    id: string;
    title: string;
    description: string;
    totalScore: number;
    myScore: number;
    averageScore: number;
    topScore: number;
    rank: number;
    participants: number;
    grade: ResultGrade;
    durationMinutes: number;
    timeSpentMinutes: number;
    startedAtText: string;
    submittedAtText: string;
    tags: string[];
    problems: ResultProblem[];
    submissions: ResultSubmission[];
    weakTags: WeakTag[];
    recommendations: Array<{
        title: string;
        description: string;
        href: string;
        icon: ComponentType<{ className?: string }>;
    }>;
};

const TEST_RESULTS: TestResult[] = [
    {
        id: "coding-test-practice-1",
        title: "실전 코딩테스트 1회차",
        description: "구현, 자료구조, 탐색, DP를 섞어 제한 시간 안에 푸는 실전형 모의 테스트입니다.",
        totalScore: 500,
        myScore: 210,
        averageScore: 248,
        topScore: 480,
        rank: 42,
        participants: 128,
        grade: "C",
        durationMinutes: 120,
        timeSpentMinutes: 112,
        startedAtText: "2026.05.03 09:00",
        submittedAtText: "2026.05.03 10:52",
        tags: ["구현", "BFS", "DP", "자료구조"],
        problems: [
            {
                id: 1000,
                order: 1,
                title: "두 수의 합",
                difficulty: "Easy",
                status: "solved",
                points: 80,
                earned: 80,
                attempts: 1,
                solvedRate: 69.5,
                timeSpentMinutes: 5,
                tags: ["implementation", "math"],
                note: "빠르게 해결했습니다.",
                lastSubmissionId: 202605030001
            },
            {
                id: 10828,
                order: 2,
                title: "스택 명령 처리",
                difficulty: "Medium",
                status: "solved",
                points: 100,
                earned: 100,
                attempts: 2,
                solvedRate: 60.5,
                timeSpentMinutes: 18,
                tags: ["stack", "data-structure"],
                note: "입출력 최적화 후 통과했습니다.",
                lastSubmissionId: 202605030002
            },
            {
                id: 7576,
                order: 3,
                title: "토마토",
                difficulty: "Medium",
                status: "wrong",
                points: 120,
                earned: 30,
                attempts: 4,
                solvedRate: 45.8,
                timeSpentMinutes: 35,
                tags: ["bfs", "queue", "graph"],
                note: "다중 시작점 BFS 처리에서 실수가 있었습니다.",
                lastSubmissionId: 202605030014
            },
            {
                id: 12865,
                order: 4,
                title: "평범한 배낭",
                difficulty: "Hard",
                status: "wrong",
                points: 120,
                earned: 0,
                attempts: 2,
                solvedRate: 38.1,
                timeSpentMinutes: 38,
                tags: ["dp", "knapsack"],
                note: "1차원 DP 갱신 방향을 반대로 처리해야 합니다.",
                lastSubmissionId: 202605030004
            },
            {
                id: 2178,
                order: 5,
                title: "미로 탐색",
                difficulty: "Medium",
                status: "todo",
                points: 80,
                earned: 0,
                attempts: 0,
                solvedRate: 44.7,
                timeSpentMinutes: 16,
                tags: ["bfs", "grid"],
                note: "시간 부족으로 제출하지 못했습니다."
            }
        ],
        submissions: [
            {
                id: 202605030014,
                problemId: 7576,
                problemTitle: "토마토",
                status: "accepted",
                language: "C++17",
                time: "20ms",
                memory: "4020KB",
                submittedAt: "2026.05.03 12:02",
                codeLength: "1488B"
            },
            {
                id: 202605030004,
                problemId: 12865,
                problemTitle: "평범한 배낭",
                status: "wrong",
                language: "C++17",
                time: "20ms",
                memory: "4256KB",
                submittedAt: "2026.05.03 12:15",
                codeLength: "1020B"
            },
            {
                id: 202605030015,
                problemId: 12865,
                problemTitle: "평범한 배낭",
                status: "compile",
                language: "JavaScript",
                time: "-",
                memory: "-",
                submittedAt: "2026.05.03 12:22",
                codeLength: "2310B"
            },
            {
                id: 202605030002,
                problemId: 10828,
                problemTitle: "스택 명령 처리",
                status: "accepted",
                language: "C++17",
                time: "12ms",
                memory: "2144KB",
                submittedAt: "2026.05.03 10:42",
                codeLength: "812B"
            }
        ],
        weakTags: [
            {
                tag: "DP",
                accuracy: 0,
                wrongCount: 2,
                reviewCount: 2,
                description: "배낭 문제에서 1차원 DP 갱신 방향 실수가 있었습니다.",
                href: "/tags/dp"
            },
            {
                tag: "BFS",
                accuracy: 50,
                wrongCount: 1,
                reviewCount: 2,
                description: "다중 시작점 BFS와 격자 BFS를 다시 확인하는 것이 좋습니다.",
                href: "/tags/bfs"
            },
            {
                tag: "Graph",
                accuracy: 50,
                wrongCount: 1,
                reviewCount: 1,
                description: "방문 처리 시점과 거리 배열 처리를 복습하세요.",
                href: "/tags/graph"
            }
        ],
        recommendations: [
            {
                title: "DP 핵심 챌린지 복습",
                description: "배낭 문제와 LIS를 다시 풀어보세요.",
                href: "/tests/dp-core-challenge/result",
                icon: Target
            },
            {
                title: "BFS 태그 학습",
                description: "토마토와 미로 탐색을 연속해서 풀면 좋습니다.",
                href: "/tags/bfs",
                icon: Hash
            },
            {
                title: "오답노트 작성",
                description: "틀린 제출의 원인을 정리하세요.",
                href: "/notes",
                icon: NotebookPen
            }
        ]
    },
    {
        id: "dp-core-challenge",
        title: "DP 핵심 챌린지",
        description: "점화식 설계, LIS, 0/1 배낭을 포함한 DP 집중 테스트입니다.",
        totalScore: 700,
        myScore: 120,
        averageScore: 218,
        topScore: 640,
        rank: 67,
        participants: 94,
        grade: "D",
        durationMinutes: 180,
        timeSpentMinutes: 177,
        startedAtText: "2026.04.25 09:00",
        submittedAtText: "2026.04.25 11:57",
        tags: ["DP", "LIS", "Knapsack"],
        problems: [
            {
                id: 1463,
                order: 1,
                title: "1로 만들기",
                difficulty: "Medium",
                status: "todo",
                points: 120,
                earned: 0,
                attempts: 0,
                solvedRate: 49.5,
                timeSpentMinutes: 35,
                tags: ["dp"],
                note: "점화식 정의를 먼저 복습하세요."
            },
            {
                id: 11053,
                order: 2,
                title: "가장 긴 증가하는 부분 수열",
                difficulty: "Medium",
                status: "solved",
                points: 140,
                earned: 120,
                attempts: 2,
                solvedRate: 63.3,
                timeSpentMinutes: 45,
                tags: ["dp", "lis"],
                note: "O(N²) 풀이로 통과했습니다.",
                lastSubmissionId: 202605020101
            },
            {
                id: 12865,
                order: 3,
                title: "평범한 배낭",
                difficulty: "Hard",
                status: "wrong",
                points: 180,
                earned: 0,
                attempts: 3,
                solvedRate: 38.1,
                timeSpentMinutes: 63,
                tags: ["dp", "knapsack"],
                note: "갱신 방향 실수로 오답이 발생했습니다.",
                lastSubmissionId: 202605030004
            }
        ],
        submissions: [
            {
                id: 202605020101,
                problemId: 11053,
                problemTitle: "가장 긴 증가하는 부분 수열",
                status: "accepted",
                language: "C++17",
                time: "16ms",
                memory: "2480KB",
                submittedAt: "2026.04.25 10:22",
                codeLength: "920B"
            },
            {
                id: 202605030004,
                problemId: 12865,
                problemTitle: "평범한 배낭",
                status: "wrong",
                language: "C++17",
                time: "20ms",
                memory: "4256KB",
                submittedAt: "2026.04.25 11:42",
                codeLength: "1020B"
            }
        ],
        weakTags: [
            {
                tag: "Knapsack",
                accuracy: 0,
                wrongCount: 3,
                reviewCount: 3,
                description: "0/1 배낭의 갱신 방향과 상태 정의를 복습하세요.",
                href: "/tags/dp"
            },
            {
                tag: "DP",
                accuracy: 33,
                wrongCount: 3,
                reviewCount: 4,
                description: "기저 상태와 점화식 정의를 먼저 적는 습관이 필요합니다.",
                href: "/tags/dp"
            }
        ],
        recommendations: [
            {
                title: "평범한 배낭 다시 풀기",
                description: "1차원 DP 갱신 방향을 다시 확인하세요.",
                href: "/problems/12865/solve",
                icon: Target
            },
            {
                title: "DP 태그 복습",
                description: "상태 정의부터 다시 정리하세요.",
                href: "/tags/dp",
                icon: Hash
            }
        ]
    }
];

const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly ProblemStatusFilter[] = ["전체", "해결", "오답", "미해결", "복습"];
const SORT_OPTIONS: readonly SortOption[] = ["order", "score-desc", "score-asc", "difficulty", "status", "accuracy-asc"];

const statusLabelToValue: Record<Exclude<ProblemStatusFilter, "전체">, ProblemStatus> = {
    해결: "solved",
    오답: "wrong",
    미해결: "todo",
    복습: "review"
};

const sortLabels: Record<SortOption, string> = {
    order: "시험 순서",
    "score-desc": "배점 높은순",
    "score-asc": "획득 점수 낮은순",
    difficulty: "난이도순",
    status: "상태순",
    "accuracy-asc": "정답률 낮은순"
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

const gradeMeta: Record<ResultGrade, { label: string; variant: "blue" | "green" | "orange" | "red"; message: string }> = {
    S: { label: "S", variant: "green", message: "매우 우수한 결과입니다." },
    A: { label: "A", variant: "green", message: "안정적인 풀이 능력을 보였습니다." },
    B: { label: "B", variant: "blue", message: "기본기는 좋지만 일부 유형 복습이 필요합니다." },
    C: { label: "C", variant: "orange", message: "오답 유형을 정리하면 빠르게 개선할 수 있습니다." },
    D: { label: "D", variant: "red", message: "핵심 개념부터 다시 복습하는 것이 좋습니다." }
};

function getResult(id: string) {
    return TEST_RESULTS.find((result) => result.id === id);
}

function getScoreRate(result: TestResult) {
    return Math.round((result.myScore / Math.max(result.totalScore, 1)) * 100);
}

function getAverageRate(result: TestResult) {
    return Math.round((result.averageScore / Math.max(result.totalScore, 1)) * 100);
}

function getSolvedCount(result: TestResult) {
    return result.problems.filter((problem) => problem.status === "solved").length;
}

function getWrongCount(result: TestResult) {
    return result.problems.filter((problem) => problem.status === "wrong").length;
}

function getReviewCount(result: TestResult) {
    return result.problems.filter((problem) => problem.status === "review" || problem.status === "wrong").length;
}

function ResultGradeBadge({ grade }: { grade: ResultGrade }) {
    const meta = gradeMeta[grade];
    return <Badge variant={meta.variant}>Grade {meta.label}</Badge>;
}

function TabButton({ tab, activeTab, onClick }: { tab: ResultTab; activeTab: ResultTab; onClick: (tab: ResultTab) => void }) {
    const labels: Record<ResultTab, string> = {
        summary: "요약",
        problems: "문제별 결과",
        submissions: "제출 기록",
        weakness: "약점 분석"
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

function SummaryTab({ result }: { result: TestResult }) {
    const scoreRate = getScoreRate(result);
    const averageRate = getAverageRate(result);
    const solvedCount = getSolvedCount(result);
    const wrongCount = getWrongCount(result);

    return (
        <div className="space-y-4">
            <Notice variant={gradeMeta[result.grade].variant === "red" ? "danger" : gradeMeta[result.grade].variant === "orange" ? "warning" : "success"} title={`Grade ${result.grade}`}>
                {gradeMeta[result.grade].message}
            </Notice>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-slate-950">점수 비교</h3>
                        <Trophy className="h-5 w-5 text-amber-500" />
                    </div>

                    <div className="space-y-4">
                        <ScoreBar label="내 점수" value={scoreRate} caption={`${result.myScore} / ${result.totalScore}점`} barClassName="bg-blue-600" />
                        <ScoreBar label="평균 점수" value={averageRate} caption={`${result.averageScore} / ${result.totalScore}점`} barClassName="bg-slate-500" />
                        <ScoreBar label="최고 점수" value={Math.round((result.topScore / result.totalScore) * 100)} caption={`${result.topScore} / ${result.totalScore}점`} barClassName="bg-emerald-600" />
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-slate-950">응시 요약</h3>
                        <Timer className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <InfoBox label="시작" value={result.startedAtText} icon={Clock3} />
                        <InfoBox label="제출" value={result.submittedAtText} icon={CheckCircle2} />
                        <InfoBox label="사용 시간" value={`${result.timeSpentMinutes}분`} icon={Timer} />
                        <InfoBox label="제한 시간" value={`${result.durationMinutes}분`} icon={Gauge} />
                        <InfoBox label="순위" value={`#${result.rank}`} icon={Medal} />
                        <InfoBox label="참여자" value={`${result.participants}명`} icon={UsersRound} />
                    </div>
                </Card>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-950">문제 결과 흐름</h3>
                    <ListChecks className="h-5 w-5 text-blue-600" />
                </div>

                <div className="grid gap-3 xl:grid-cols-5">
                    {result.problems.map((problem) => (
                        <Link key={problem.id} href={`/problems/${problem.id}`} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <Badge variant="blue">Q{problem.order}</Badge>
                                <ProblemStatusBadge value={problem.status} />
                            </div>
                            <p className="line-clamp-1 font-black text-slate-950">{problem.title}</p>
                            <p className="mt-2 text-sm font-bold text-slate-500">{problem.earned} / {problem.points}점</p>
                        </Link>
                    ))}
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <ResultMetricCard title="해결" value={`${solvedCount}문제`} description="정답 처리된 문제" icon={CheckCircle2} tone="green" />
                <ResultMetricCard title="오답" value={`${wrongCount}문제`} description="복습이 필요한 문제" icon={XCircle} tone="red" />
                <ResultMetricCard title="시간 사용률" value={`${Math.round((result.timeSpentMinutes / result.durationMinutes) * 100)}%`} description="제한 시간 대비 사용" icon={Timer} tone="orange" />
            </div>
        </div>
    );
}

function ScoreBar({ label, value, caption, barClassName }: { label: string; value: number; caption: string; barClassName: string }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="text-slate-700">{label}</span>
                <span className="text-slate-500">{caption}</span>
            </div>
            <ProgressBar value={value} barClassName={barClassName} />
        </div>
    );
}

function InfoBox({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-black text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
            </div>
        </div>
    );
}

function ResultMetricCard({ title, value, description, icon: Icon, tone }: { title: string; value: string; description: string; icon: ComponentType<{ className?: string }>; tone: "green" | "red" | "orange" }) {
    const toneClass = {
        green: "bg-emerald-50 text-emerald-700",
        red: "bg-rose-50 text-rose-700",
        orange: "bg-orange-50 text-orange-700"
    }[tone];

    return (
        <Card className="p-5">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </Card>
    );
}

function ProblemsTab({
                         problems,
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
    problems: ResultProblem[];
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
                title="문제별 결과 검색 / 필터"
                onReset={resetFilters}
                gridClassName="grid gap-3 xl:grid-cols-[1.4fr_160px_160px_190px_auto] xl:items-end"
            >
                <SearchInput value={keyword} onChange={setKeyword} placeholder="문제 번호, 제목, 태그, 메모 검색" />
                <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
            </FilterPanel>

            <ListHeader
                title="문제별 결과"
                description={`검색 조건에 맞는 문제 ${problems.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
            />

            {problems.length === 0 ? (
                <EmptyState title="문제를 찾을 수 없습니다." description="검색어 또는 필터 조건을 변경해보세요." icon={Search} onReset={resetFilters} />
            ) : viewMode === "card" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                    {problems.map((problem) => <ResultProblemCard key={problem.id} problem={problem} />)}
                </div>
            ) : (
                <ResultProblemsTable problems={problems} />
            )}
        </div>
    );
}

function ResultProblemCard({ problem }: { problem: ResultProblem }) {
    const earnedRate = Math.round((problem.earned / Math.max(problem.points, 1)) * 100);

    return (
        <Card hover className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="blue">Q{problem.order}</Badge>
                <DifficultyBadge value={problem.difficulty} />
                <ProblemStatusBadge value={problem.status} />
                <Badge>{problem.earned}/{problem.points}점</Badge>
            </div>

            <Link href={`/problems/${problem.id}`} className="text-xl font-black text-slate-950 transition hover:text-blue-600">
                {problem.id}. {problem.title}
            </Link>
            <p className="mt-3 text-sm leading-7 text-slate-500">{problem.note}</p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">획득 점수</span>
                    <span className="text-blue-600">{earnedRate}%</span>
                </div>
                <ProgressBar value={earnedRate} barClassName={earnedRate === 100 ? "bg-emerald-600" : earnedRate > 0 ? "bg-orange-500" : "bg-rose-600"} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="시도" value={`${problem.attempts}`} />
                <MiniStat label="시간" value={`${problem.timeSpentMinutes}분`} />
                <MiniStat label="정답률" value={`${problem.solvedRate}%`} />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                {problem.lastSubmissionId && <AppLinkButton href={`/submissions/${problem.lastSubmissionId}`} variant="secondary" iconRight={ChevronRight}>제출 보기</AppLinkButton>}
                <AppLinkButton href={`/problems/${problem.id}/solve`} variant="primary" iconRight={ArrowRight}>다시 풀기</AppLinkButton>
            </div>
        </Card>
    );
}

function ResultProblemsTable({ problems }: { problems: ResultProblem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">문제</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4 text-right">점수</th>
                        <th className="px-5 py-4 text-right">시도</th>
                        <th className="px-5 py-4 text-right">시간</th>
                        <th className="px-5 py-4 text-right">정답률</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {problems.map((problem) => (
                        <tr key={problem.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link href={`/problems/${problem.id}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                    Q{problem.order}. {problem.title}
                                </Link>
                                <p className="mt-1 text-xs font-bold text-slate-400">#{problem.id}</p>
                            </td>
                            <td className="px-5 py-4"><DifficultyBadge value={problem.difficulty} /></td>
                            <td className="px-5 py-4"><ProblemStatusBadge value={problem.status} /></td>
                            <td className="px-5 py-4 text-right font-black text-slate-950">{problem.earned}/{problem.points}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{problem.attempts}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{problem.timeSpentMinutes}분</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{problem.solvedRate}%</td>
                            <td className="px-5 py-4 text-right">
                                <AppLinkButton href={`/problems/${problem.id}/solve`} size="sm" iconRight={ChevronRight}>복습</AppLinkButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function SubmissionsTab({ submissions }: { submissions: ResultSubmission[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">제출</th>
                        <th className="px-5 py-4">문제</th>
                        <th className="px-5 py-4">결과</th>
                        <th className="px-5 py-4">언어</th>
                        <th className="px-5 py-4 text-right">시간</th>
                        <th className="px-5 py-4 text-right">메모리</th>
                        <th className="px-5 py-4 text-right">코드</th>
                        <th className="px-5 py-4">제출 시간</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {submissions.map((submission) => (
                        <tr key={submission.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link href={`/submissions/${submission.id}`} className="font-black text-slate-950 transition hover:text-blue-600">#{submission.id}</Link>
                            </td>
                            <td className="px-5 py-4">
                                <Link href={`/problems/${submission.problemId}`} className="font-black text-slate-950 transition hover:text-blue-600">{submission.problemTitle}</Link>
                                <p className="mt-1 text-xs font-bold text-slate-400">#{submission.problemId}</p>
                            </td>
                            <td className="px-5 py-4"><SubmissionStatusBadge value={submission.status} /></td>
                            <td className="px-5 py-4"><Badge variant="blue">{submission.language}</Badge></td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{submission.time}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{submission.memory}</td>
                            <td className="px-5 py-4 text-right font-bold text-slate-600">{submission.codeLength}</td>
                            <td className="px-5 py-4 font-bold text-slate-500">{submission.submittedAt}</td>
                            <td className="px-5 py-4 text-right"><AppLinkButton href={`/submissions/${submission.id}`} size="sm" iconRight={ChevronRight}>상세</AppLinkButton></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function WeaknessTab({ result }: { result: TestResult }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
                {result.weakTags.map((tag) => (
                    <Card key={tag.tag} className="p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <Link href={tag.href} className="text-xl font-black text-slate-950 transition hover:text-blue-600">#{tag.tag}</Link>
                            <Badge variant={tag.accuracy < 50 ? "red" : "orange"}>정답률 {tag.accuracy}%</Badge>
                        </div>
                        <p className="text-sm leading-7 text-slate-500">{tag.description}</p>
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm font-black">
                                <span className="text-slate-600">태그 정답률</span>
                                <span className="text-rose-600">{tag.accuracy}%</span>
                            </div>
                            <ProgressBar value={tag.accuracy} barClassName={tag.accuracy < 50 ? "bg-rose-600" : "bg-orange-500"} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <MiniStat label="오답" value={`${tag.wrongCount}`} />
                            <MiniStat label="복습" value={`${tag.reviewCount}`} />
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-black text-slate-950">추천 복습 흐름</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    {result.recommendations.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.title} href={item.href} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="font-black text-slate-950">{item.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                            </Link>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

function ResultSideSummary({ result }: { result: TestResult }) {
    const scoreRate = getScoreRate(result);

    return (
        <SidePanel title="결과 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-sm font-black text-slate-300">내 점수율</p>
                <p className="mt-1 text-5xl font-black">{scoreRate}%</p>
                <ProgressBar value={scoreRate} className="mt-5 bg-white/10" barClassName={scoreRate >= 70 ? "bg-emerald-500" : scoreRate >= 40 ? "bg-orange-500" : "bg-rose-500"} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="점수" value={`${result.myScore}`} />
                <MiniStat label="총점" value={`${result.totalScore}`} />
                <MiniStat label="등급" value={result.grade} />
            </div>
        </SidePanel>
    );
}

function ProblemStatusPanel({ result }: { result: TestResult }) {
    const solved = getSolvedCount(result);
    const wrong = getWrongCount(result);
    const review = getReviewCount(result);
    const todo = result.problems.filter((problem) => problem.status === "todo").length;
    const total = Math.max(result.problems.length, 1);

    return (
        <SidePanel title="문제 상태" badge={<ListChecks className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                <DistributionRow label="해결" value={solved} total={total} icon={CheckCircle2} barClassName="bg-emerald-600" />
                <DistributionRow label="오답" value={wrong} total={total} icon={XCircle} barClassName="bg-rose-600" />
                <DistributionRow label="복습" value={review} total={total} icon={RotateCcw} barClassName="bg-orange-500" />
                <DistributionRow label="미해결" value={todo} total={total} icon={AlertTriangle} barClassName="bg-slate-400" />
            </div>
        </SidePanel>
    );
}

function DistributionRow({ label, value, total, icon: Icon, barClassName }: { label: string; value: number; total: number; icon: ComponentType<{ className?: string }>; barClassName: string }) {
    const percent = Math.round((value / total) * 100);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="flex items-center gap-2 text-slate-700"><Icon className="h-4 w-4" />{label}</span>
                <span className="text-slate-500">{value}개</span>
            </div>
            <ProgressBar value={percent} barClassName={barClassName} />
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

function NotFoundResult({ id }: { id: string }) {
    return (
        <AppShell title="결과를 찾을 수 없습니다" description="요청한 테스트 결과가 현재 로컬 데이터에 없습니다.">
            <EmptyState
                title={`/${id} 결과를 찾을 수 없습니다.`}
                description="테스트 ID를 다시 확인하거나 모의 테스트 목록으로 돌아가세요."
                icon={Search}
                action={<AppLinkButton href="/tests" variant="dark" icon={ArrowLeft}>모의 테스트로 돌아가기</AppLinkButton>}
            />
        </AppShell>
    );
}

export default function TestResultPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");
    const result = getResult(id);

    const [activeTab, setActiveTab] = useState<ResultTab>("summary");
    const [keyword, setKeyword] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<ProblemStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("order");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredProblems = useMemo(() => {
        if (!result) return [];
        const lowerKeyword = keyword.trim().toLowerCase();

        const rows = result.problems.filter((problem) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(problem.id).includes(lowerKeyword) ||
                problem.title.toLowerCase().includes(lowerKeyword) ||
                problem.note.toLowerCase().includes(lowerKeyword) ||
                problem.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesDifficulty = difficulty === "전체" || problem.difficulty === difficulty;
            const matchesStatus = status === "전체" || problem.status === statusLabelToValue[status];

            return matchesKeyword && matchesDifficulty && matchesStatus;
        });

        return rows.sort((a, b) => {
            switch (sort) {
                case "score-desc":
                    return b.points - a.points;
                case "score-asc":
                    return a.earned - b.earned;
                case "difficulty":
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                case "status":
                    return statusOrder[a.status] - statusOrder[b.status];
                case "accuracy-asc":
                    return a.solvedRate - b.solvedRate;
                case "order":
                default:
                    return a.order - b.order;
            }
        });
    }, [result, keyword, difficulty, status, sort]);

    if (!result) {
        return <NotFoundResult id={id} />;
    }

    const scoreRate = getScoreRate(result);
    const solvedCount = getSolvedCount(result);
    const wrongCount = getWrongCount(result);
    const reviewCount = getReviewCount(result);
    const nextReviewProblem = result.problems.find((problem) => problem.status === "wrong" || problem.status === "review") ?? result.problems[0];

    const resetFilters = () => {
        setKeyword("");
        setDifficulty("전체");
        setStatus("전체");
        setSort("order");
    };

    return (
        <AppShell title={`${result.title} 결과`} description={`${result.myScore}/${result.totalScore}점 · Grade ${result.grade}`}>
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link href={`/tests/${result.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                테스트 상세
                            </Link>
                            <Badge variant="blue">Result</Badge>
                            <ResultGradeBadge grade={result.grade} />
                            <Badge>{result.rank}위</Badge>
                        </>
                    }
                    title={`${result.title} 결과 분석`}
                    description={result.description}
                    icon={Trophy}
                    rightTitle="내 점수"
                    rightValue={`${result.myScore}`}
                    rightCaption={`${result.totalScore}점 만점 · ${scoreRate}%`}
                    metrics={[
                        { label: "해결", value: `${solvedCount}` },
                        { label: "오답", value: `${wrongCount}` },
                        { label: "순위", value: `#${result.rank}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href={`/problems/${nextReviewProblem.id}/solve`} variant="primary" size="lg" iconRight={ArrowRight}>오답 다시 풀기</AppLinkButton>
                            <AppLinkButton href={`/tests/${result.id}/solve`} variant="white" size="lg" icon={Play}>다시 응시</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="내 점수" value={`${result.myScore}`} caption={`${scoreRate}% 달성`} icon={Trophy} tone="blue" />
                    <StatCard label="평균 점수" value={`${result.averageScore}`} caption={`최고 ${result.topScore}점`} icon={BarChart3} tone="orange" />
                    <StatCard label="해결 문제" value={`${solvedCount}/${result.problems.length}`} caption="정답 처리" icon={CheckCircle2} tone="green" />
                    <StatCard label="복습 필요" value={reviewCount.toLocaleString()} caption="오답 + 복습" icon={RotateCcw} tone="red" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(["summary", "problems", "submissions", "weakness"] as ResultTab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
                                ))}
                            </div>
                        </Card>

                        {activeTab === "summary" && <SummaryTab result={result} />}
                        {activeTab === "problems" && (
                            <ProblemsTab
                                problems={filteredProblems}
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
                        {activeTab === "submissions" && <SubmissionsTab submissions={result.submissions} />}
                        {activeTab === "weakness" && <WeaknessTab result={result} />}
                    </div>

                    <aside className="space-y-4">
                        <ResultSideSummary result={result} />
                        <ProblemStatusPanel result={result} />

                        <SidePanel title="약점 태그" badge={<Flame className="h-5 w-5 text-rose-600" />}>
                            <div className="space-y-2">
                                {result.weakTags.map((tag) => (
                                    <Link key={tag.tag} href={tag.href} className="block rounded-2xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-black text-rose-800">#{tag.tag}</span>
                                            <span className="text-xs font-black text-rose-600">{tag.accuracy}%</span>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-rose-700">{tag.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href={`/problems/${nextReviewProblem.id}/solve`} label="오답 다시 풀기" icon={Target} />
                                <QuickLink href={`/tests/${result.id}/solve`} label="다시 응시" icon={Play} />
                                <QuickLink href={`/tests/${result.id}`} label="테스트 상세" icon={Terminal} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/tags/dp" label="약점 태그 복습" icon={Hash} />
                                <QuickLink href="/tests" label="모의 테스트 목록" icon={Layers3} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/tests/[id]/result`는 샘플 결과 데이터 기반입니다. API는 `GET /api/tests/:id/result`, `GET /api/tests/:id/submissions`, `POST /api/tests/:id/retry`를 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
