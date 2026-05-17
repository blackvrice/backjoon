"use client";

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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Database,
    FileText,
    Flame,
    FolderCode,
    Gauge,
    Hash,
    Layers3,
    ListChecks,
    NotebookPen,
    Play,
    RotateCcw,
    Search,
    Sparkles,
    Star,
    Target,
    Trophy,
    UsersRound,
    Zap
} from "lucide-react";

type SetCategory = "입문" | "자료구조" | "그래프" | "DP" | "문자열" | "수학" | "실전";
type SetStatus = "not-started" | "in-progress" | "completed";
type DifficultyFilter = "전체" | Difficulty;
type ProblemStatusFilter = "전체" | "해결" | "오답" | "미해결" | "복습";
type SortOption = "order" | "number-asc" | "difficulty" | "solved-rate" | "score-desc" | "status";

type SetProblem = ProblemCardData & {
    order: number;
    category: string;
    required: boolean;
};

type LearningSet = {
    id: string;
    title: string;
    description: string;
    category: SetCategory;
    level: Difficulty;
    tags: string[];
    status: SetStatus;
    estimatedTime: string;
    participants: number;
    recommended: boolean;
    featured: boolean;
    updatedAt: string;
    updatedAtText: string;
    author: string;
    target: string;
    guide: string[];
    problems: SetProblem[];
};

const SETS: LearningSet[] = [
    {
        id: "beginner-implementation-30",
        title: "입문자를 위한 구현 30제",
        description: "입출력, 조건문, 반복문, 문자열 처리 중심의 기본기 세트입니다. 코딩 테스트를 처음 시작할 때 가장 먼저 풀기 좋습니다.",
        category: "입문",
        level: "Easy",
        tags: ["구현", "입출력", "반복문", "문자열"],
        status: "in-progress",
        estimatedTime: "5일",
        participants: 512,
        recommended: true,
        featured: true,
        updatedAt: "2026-05-03",
        updatedAtText: "2026.05.03",
        author: "CodeTest Team",
        target: "코딩 테스트 입문자, 기본 문법 복습이 필요한 사용자",
        guide: [
            "1일차에는 입출력과 사칙연산 문제를 먼저 해결합니다.",
            "2~3일차에는 반복문과 조건문 문제를 풉니다.",
            "문자열 문제는 출력 형식과 공백 처리를 주의합니다.",
            "오답 문제는 /notes에 정리하고 다음 날 다시 풉니다."
        ],
        problems: [
            {
                order: 1,
                id: 1000,
                title: "두 수의 합",
                difficulty: "Easy",
                category: "구현",
                score: 100,
                status: "solved",
                solvedRate: 69.5,
                submissions: 184,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["implementation", "math", "입출력"],
                memo: "기본 입출력과 사칙연산을 확인하는 입문 문제입니다.",
                recommendedOrder: 1,
                required: true
            },
            {
                order: 2,
                id: 10871,
                title: "X보다 작은 수",
                difficulty: "Easy",
                category: "구현",
                score: 100,
                status: "todo",
                solvedRate: 62.1,
                submissions: 151,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["implementation", "array", "반복문"],
                memo: "배열 순회와 조건 출력 연습에 적합합니다.",
                recommendedOrder: 2,
                required: true
            },
            {
                order: 3,
                id: 2675,
                title: "문자열 반복",
                difficulty: "Easy",
                category: "문자열",
                score: 100,
                status: "solved",
                solvedRate: 66.2,
                submissions: 128,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["string", "implementation"],
                memo: "문자 단위 반복 출력 문제입니다.",
                recommendedOrder: 3,
                required: true
            },
            {
                order: 4,
                id: 2609,
                title: "최대공약수와 최소공배수",
                difficulty: "Easy",
                category: "수학",
                score: 100,
                status: "todo",
                solvedRate: 57.4,
                submissions: 112,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["math", "number-theory"],
                memo: "유클리드 호제법을 사용합니다.",
                recommendedOrder: 4,
                required: false
            }
        ]
    },
    {
        id: "bfs-dfs-graph",
        title: "BFS / DFS 그래프 탐색",
        description: "그래프 순회, 격자 탐색, 연결 요소, 최단 거리 문제를 단계별로 연습합니다.",
        category: "그래프",
        level: "Medium",
        tags: ["BFS", "DFS", "그래프", "격자"],
        status: "in-progress",
        estimatedTime: "7일",
        participants: 421,
        recommended: true,
        featured: true,
        updatedAt: "2026-05-01",
        updatedAtText: "2026.05.01",
        author: "CodeTest Team",
        target: "BFS/DFS 개념을 익힌 뒤 대표 유형을 정리하려는 사용자",
        guide: [
            "DFS와 BFS 기본 순회 문제를 먼저 풉니다.",
            "격자 탐색은 방문 처리 시점을 큐에 넣는 순간으로 통일합니다.",
            "다중 시작점 BFS는 모든 시작점을 큐에 먼저 넣고 시작합니다.",
            "거리 배열과 방문 배열을 하나로 합칠 수 있는지 고민합니다."
        ],
        problems: [
            {
                order: 1,
                id: 1260,
                title: "DFS와 BFS",
                difficulty: "Medium",
                category: "그래프",
                score: 150,
                status: "todo",
                solvedRate: 50.1,
                submissions: 142,
                timeLimit: "2초",
                memoryLimit: "256MB",
                tags: ["dfs", "bfs", "graph"],
                memo: "방문 순서를 맞추려면 인접 리스트 정렬이 필요합니다.",
                recommendedOrder: 1,
                required: true
            },
            {
                order: 2,
                id: 2178,
                title: "미로 탐색",
                difficulty: "Medium",
                category: "그래프",
                score: 150,
                status: "todo",
                solvedRate: 44.7,
                submissions: 115,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["bfs", "graph", "grid"],
                memo: "격자 BFS의 기본 문제입니다.",
                recommendedOrder: 2,
                required: true
            },
            {
                order: 3,
                id: 7576,
                title: "토마토",
                difficulty: "Medium",
                category: "그래프",
                score: 180,
                status: "wrong",
                solvedRate: 45.8,
                submissions: 96,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["bfs", "queue", "graph"],
                memo: "다중 시작점 BFS입니다. 모든 익은 토마토를 큐에 넣어야 합니다.",
                recommendedOrder: 3,
                required: true
            },
            {
                order: 4,
                id: 1753,
                title: "최단경로",
                difficulty: "Hard",
                category: "그래프",
                score: 220,
                status: "todo",
                solvedRate: 29.4,
                submissions: 72,
                timeLimit: "1초",
                memoryLimit: "512MB",
                tags: ["dijkstra", "graph", "shortest-path"],
                memo: "우선순위 큐와 인접 리스트를 사용합니다.",
                recommendedOrder: 4,
                required: false
            }
        ]
    },
    {
        id: "dynamic-programming-core",
        title: "동적 계획법 핵심 유형",
        description: "점화식 설계, 메모이제이션, 1차원/2차원 DP, LIS, 배낭 문제를 연습합니다.",
        category: "DP",
        level: "Hard",
        tags: ["DP", "점화식", "LIS", "배낭"],
        status: "in-progress",
        estimatedTime: "10일",
        participants: 284,
        recommended: true,
        featured: true,
        updatedAt: "2026-04-25",
        updatedAtText: "2026.04.25",
        author: "CodeTest Team",
        target: "DP 점화식 설계와 대표 유형을 정리하려는 사용자",
        guide: [
            "작은 상태부터 정의하고 dp 배열의 의미를 문장으로 적습니다.",
            "이전 상태에서 현재 상태로 오는 관계를 먼저 찾습니다.",
            "1차원 최적화는 갱신 방향을 반드시 확인합니다.",
            "배낭 문제는 같은 물건을 중복 선택하는지 여부를 구분합니다."
        ],
        problems: [
            {
                order: 1,
                id: 1463,
                title: "1로 만들기",
                difficulty: "Medium",
                category: "DP",
                score: 140,
                status: "todo",
                solvedRate: 49.5,
                submissions: 178,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["dp", "dynamic-programming"],
                memo: "dp[i]를 i를 1로 만드는 최소 연산 수로 정의합니다.",
                recommendedOrder: 1,
                required: true
            },
            {
                order: 2,
                id: 11053,
                title: "가장 긴 증가하는 부분 수열",
                difficulty: "Medium",
                category: "DP",
                score: 150,
                status: "solved",
                solvedRate: 63.3,
                submissions: 101,
                timeLimit: "1초",
                memoryLimit: "256MB",
                tags: ["dp", "lis", "binary-search"],
                memo: "O(N²) DP와 O(N log N) 풀이를 모두 연습할 수 있습니다.",
                recommendedOrder: 2,
                required: true
            },
            {
                order: 3,
                id: 12865,
                title: "평범한 배낭",
                difficulty: "Hard",
                category: "DP",
                score: 200,
                status: "wrong",
                solvedRate: 38.1,
                submissions: 76,
                timeLimit: "2초",
                memoryLimit: "512MB",
                tags: ["dp", "knapsack"],
                memo: "1차원 DP는 무게를 뒤에서 앞으로 갱신해야 합니다.",
                recommendedOrder: 3,
                required: true
            }
        ]
    }
];

const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly ProblemStatusFilter[] = ["전체", "해결", "오답", "미해결", "복습"];
const SORT_OPTIONS: readonly SortOption[] = ["order", "number-asc", "difficulty", "solved-rate", "score-desc", "status"];

const statusLabelToValue: Record<Exclude<ProblemStatusFilter, "전체">, ProblemStatus> = {
    해결: "solved",
    오답: "wrong",
    미해결: "todo",
    복습: "review"
};

const sortLabels: Record<SortOption, string> = {
    order: "세트 순서",
    "number-asc": "번호 낮은순",
    difficulty: "난이도순",
    "solved-rate": "정답률 높은순",
    "score-desc": "점수 높은순",
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

const setStatusMeta: Record<SetStatus, { label: string; variant: "default" | "blue" | "green"; icon: ComponentType<{ className?: string }> }> = {
    "not-started": { label: "진행 전", variant: "default", icon: Clock3 },
    "in-progress": { label: "진행 중", variant: "blue", icon: Target },
    completed: { label: "완료", variant: "green", icon: CheckCircle2 }
};

function getSet(id: string) {
    return SETS.find((set) => set.id === id);
}

function getSetProgress(set: LearningSet) {
    const solved = set.problems.filter((problem) => problem.status === "solved").length;
    return Math.round((solved / Math.max(set.problems.length, 1)) * 100);
}

function getSolvedCount(set: LearningSet) {
    return set.problems.filter((problem) => problem.status === "solved").length;
}

function getNextProblem(set: LearningSet) {
    return set.problems.find((problem) => problem.status !== "solved") ?? set.problems[0];
}

function SetStatusBadge({ status }: { status: SetStatus }) {
    const meta = setStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function GuidePanel({ guide }: { guide: string[] }) {
    return (
        <SidePanel title="학습 가이드" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {guide.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-600">{index + 1}</span>
                        {item}
                    </div>
                ))}
            </div>
        </SidePanel>
    );
}

function SetProblemTimeline({ problems }: { problems: SetProblem[] }) {
    return (
        <SidePanel title="풀이 순서" badge={<ListChecks className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {problems.map((problem) => (
                    <Link key={problem.id} href={`/problems/${problem.id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${problem.status === "solved" ? "bg-emerald-100 text-emerald-700" : problem.status === "wrong" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-500"}`}>
                            {problem.order}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">{problem.title}</p>
                            <p className="mt-0.5 text-xs font-bold text-slate-400">#{problem.id}</p>
                        </div>
                        <ProblemStatusBadge value={problem.status ?? "todo"} />
                    </Link>
                ))}
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

function NotFoundSet({ id }: { id: string }) {
    return (
        <AppShell title="문제 세트를 찾을 수 없습니다" description="요청한 세트가 현재 로컬 데이터에 없습니다.">
            <EmptyState
                title={`/${id} 세트를 찾을 수 없습니다.`}
                description="세트 ID를 다시 확인하거나 문제 세트 목록으로 돌아가세요."
                icon={Layers3}
                action={
                    <AppLinkButton href="/sets" variant="dark" icon={ArrowLeft}>
                        문제 세트로 돌아가기
                    </AppLinkButton>
                }
            />
        </AppShell>
    );
}

export default function SetDetailPage() {
    const params = useParams<{ id: string }>();
    const id = String(params.id ?? "");
    const set = getSet(id);

    const [keyword, setKeyword] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<ProblemStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("order");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredProblems = useMemo(() => {
        if (!set) {
            return [];
        }

        const lowerKeyword = keyword.trim().toLowerCase();

        const result = set.problems.filter((problem) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(problem.id).includes(lowerKeyword) ||
                problem.title.toLowerCase().includes(lowerKeyword) ||
                problem.category.toLowerCase().includes(lowerKeyword) ||
                problem.memo?.toLowerCase().includes(lowerKeyword) ||
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
                case "solved-rate":
                    return (b.solvedRate ?? 0) - (a.solvedRate ?? 0);
                case "score-desc":
                    return (b.score ?? 0) - (a.score ?? 0);
                case "status":
                    return statusOrder[a.status ?? "todo"] - statusOrder[b.status ?? "todo"];
                case "order":
                default:
                    return a.order - b.order;
            }
        });
    }, [set, keyword, difficulty, status, sort]);

    if (!set) {
        return <NotFoundSet id={id} />;
    }

    const solvedCount = getSolvedCount(set);
    const wrongCount = set.problems.filter((problem) => problem.status === "wrong").length;
    const todoCount = set.problems.filter((problem) => problem.status === "todo").length;
    const progress = getSetProgress(set);
    const nextProblem = getNextProblem(set);
    const requiredProblems = set.problems.filter((problem) => problem.required).length;
    const totalScore = set.problems.reduce((sum, problem) => sum + (problem.score ?? 0), 0);

    const resetFilters = () => {
        setKeyword("");
        setDifficulty("전체");
        setStatus("전체");
        setSort("order");
    };

    return (
        <AppShell title={set.title} description={`${set.category} · ${set.level} · ${set.problems.length}문제`}>
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link href="/sets" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                문제 세트
                            </Link>
                            <Badge variant="blue">Set</Badge>
                            <Badge>{set.category}</Badge>
                            <DifficultyBadge value={set.level} />
                            <SetStatusBadge status={set.status} />
                            {set.featured && <Badge variant="amber"><Flame className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
                        </>
                    }
                    title={set.title}
                    description={set.description}
                    icon={FolderCode}
                    rightTitle="세트 진행률"
                    rightValue={`${progress}%`}
                    rightCaption={`${solvedCount} / ${set.problems.length} 문제 해결`}
                    metrics={[
                        { label: "문제", value: `${set.problems.length}` },
                        { label: "필수", value: `${requiredProblems}` },
                        { label: "예상", value: set.estimatedTime }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href={`/problems/${nextProblem.id}/solve`} variant="primary" size="lg" iconRight={ArrowRight}>이어서 풀기</AppLinkButton>
                            <AppLinkButton href="/sets" variant="white" size="lg" icon={Layers3}>다른 세트 보기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 문제" value={set.problems.length.toLocaleString()} caption={`총점 ${totalScore}점`} icon={Database} />
                    <StatCard label="해결" value={solvedCount.toLocaleString()} caption={`진행률 ${progress}%`} icon={CheckCircle2} tone="green" />
                    <StatCard label="오답" value={wrongCount.toLocaleString()} caption="복습 추천 문제" icon={RotateCcw} tone="orange" />
                    <StatCard label="남은 문제" value={todoCount.toLocaleString()} caption="아직 풀지 않은 문제" icon={Clock3} tone="blue" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <Card className="p-5">
                            <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-center">
                                <div>
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {set.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-950">세트 소개</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-500">{set.description}</p>
                                    <p className="mt-2 text-sm leading-7 text-slate-500">대상: {set.target}</p>
                                </div>
                                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                    <p className="text-sm font-black text-slate-300">학습 진행률</p>
                                    <p className="mt-1 text-5xl font-black">{progress}%</p>
                                    <ProgressBar value={progress} className="mt-5 bg-white/10" />
                                </div>
                            </div>
                        </Card>

                        <FilterPanel
                            title="세트 문제 검색 / 필터"
                            onReset={resetFilters}
                            gridClassName="grid gap-3 xl:grid-cols-[1.4fr_160px_160px_190px_auto] xl:items-end"
                        >
                            <SearchInput value={keyword} onChange={setKeyword} placeholder="문제 번호, 제목, 태그, 메모 검색" />
                            <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                            <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                            <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                        </FilterPanel>

                        <section>
                            <ListHeader
                                title="세트 문제 목록"
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
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="세트 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">완료율</p>
                                <p className="mt-1 text-5xl font-black">{progress}%</p>
                                <ProgressBar value={progress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="해결" value={`${solvedCount}`} />
                                <MiniStat label="오답" value={`${wrongCount}`} />
                                <MiniStat label="남음" value={`${todoCount}`} />
                            </div>
                        </SidePanel>

                        <GuidePanel guide={set.guide} />

                        <SetProblemTimeline problems={set.problems} />

                        <SidePanel title="세트 정보" badge={<FileText className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2 text-sm font-bold text-slate-600">
                                <InfoRow label="작성자" value={set.author} />
                                <InfoRow label="참여자" value={`${set.participants.toLocaleString()}명`} />
                                <InfoRow label="예상 시간" value={set.estimatedTime} />
                                <InfoRow label="최근 업데이트" value={set.updatedAtText} />
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href={`/problems/${nextProblem.id}/solve`} label="이어서 풀기" icon={Play} />
                                <QuickLink href="/sets" label="문제 세트 목록" icon={Layers3} />
                                <QuickLink href="/problems" label="전체 문제" icon={BookOpen} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/goals" label="학습 목표" icon={Target} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/sets/[id]`는 샘플 세트 데이터 기반입니다. API는 `GET /api/sets/:id`, `GET /api/sets/:id/problems`, `PATCH /api/sets/:id/progress`를 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-slate-400">{label}</span>
            <span className="text-right text-slate-700">{value}</span>
        </div>
    );
}
