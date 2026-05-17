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
    ArrowLeft,
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Compass,
    Database,
    Flame,
    Gauge,
    Hash,
    Layers3,
    Lightbulb,
    ListChecks,
    NotebookPen,
    Route,
    Search,
    Sparkles,
    Star,
    Target,
    Trophy,
    Zap
} from "lucide-react";

type TagCategory = "기초" | "자료구조" | "그래프" | "DP" | "수학" | "문자열" | "탐색" | "실전";
type TagStatus = "not-started" | "learning" | "strong" | "weak";
type DifficultyFilter = "전체" | Difficulty;
type ProblemStatusFilter = "전체" | "해결" | "오답" | "미해결" | "복습";
type SortOption = "recommended" | "number-asc" | "difficulty" | "solved-rate" | "score-desc" | "status";

type TagProblem = ProblemCardData & {
    category: string;
    recommendedOrder: number;
    reason: string;
    required: boolean;
};

type TagDetail = {
    slug: string;
    name: string;
    description: string;
    category: TagCategory;
    difficulty: Difficulty;
    totalProblems: number;
    solvedProblems: number;
    wrongProblems: number;
    reviewProblems: number;
    accuracy: number;
    status: TagStatus;
    recommended: boolean;
    featured: boolean;
    updatedAt: string;
    updatedAtText: string;
    relatedTags: string[];
    aliases: string[];
    guide: string[];
    concepts: string[];
    mistakes: string[];
    learningPath: Array<{
        title: string;
        description: string;
        href: string;
    }>;
    problems: TagProblem[];
};

const TAGS: TagDetail[] = [
    {
        slug: "bfs",
        name: "BFS",
        description: "너비 우선 탐색입니다. 최단 거리, 격자 탐색, 다중 시작점 탐색 문제의 핵심입니다. 큐를 사용해 가까운 노드부터 차례대로 방문합니다.",
        category: "그래프",
        difficulty: "Medium",
        totalProblems: 132,
        solvedProblems: 37,
        wrongProblems: 14,
        reviewProblems: 11,
        accuracy: 64.5,
        status: "learning",
        recommended: true,
        featured: true,
        updatedAt: "2026-05-02",
        updatedAtText: "2026.05.02",
        relatedTags: ["graph", "queue", "grid", "shortest-path", "dfs"],
        aliases: ["Breadth First Search", "너비 우선 탐색", "Queue Search"],
        guide: [
            "방문 처리는 큐에 넣는 순간 하는 것이 안전합니다.",
            "격자 문제에서는 dy/dx 배열로 이동 방향을 통일합니다.",
            "최단 거리 문제에서는 처음 도착한 거리가 최단 거리입니다.",
            "다중 시작점 BFS는 모든 시작점을 큐에 먼저 넣고 시작합니다."
        ],
        concepts: ["Queue", "Visited", "Distance", "Grid traversal", "Multi-source BFS"],
        mistakes: [
            "방문 처리를 큐에서 꺼낼 때 해서 중복 삽입이 발생함",
            "행/열 좌표를 반대로 사용함",
            "시작점이 여러 개인 문제에서 시작점을 하나만 큐에 넣음",
            "도달 불가능한 칸을 마지막에 검사하지 않음"
        ],
        learningPath: [
            { title: "큐 기본기", description: "BFS 전에 큐 명령 처리와 FIFO 구조를 복습합니다.", href: "/tags/queue" },
            { title: "DFS와 BFS", description: "그래프 순회 순서와 방문 배열 사용법을 연습합니다.", href: "/problems/1260" },
            { title: "격자 BFS", description: "미로 탐색처럼 2차원 배열에서 최단 거리를 구합니다.", href: "/problems/2178" },
            { title: "다중 시작점 BFS", description: "토마토처럼 여러 시작점에서 동시에 퍼지는 문제를 풉니다.", href: "/problems/7576" }
        ],
        problems: [
            {
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
                reason: "BFS와 DFS 순회 차이를 함께 확인할 수 있습니다.",
                required: true
            },
            {
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
                reason: "BFS로 최단 칸 수를 구하는 대표 문제입니다.",
                required: true
            },
            {
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
                reason: "다중 시작점 BFS와 불가능 케이스 처리를 연습합니다.",
                required: true
            },
            {
                id: 1697,
                title: "숨바꼭질",
                difficulty: "Medium",
                category: "그래프",
                score: 170,
                status: "review",
                solvedRate: 43.2,
                submissions: 82,
                timeLimit: "2초",
                memoryLimit: "256MB",
                tags: ["bfs", "shortest-path"],
                memo: "수직선에서 이동 가능한 상태를 그래프로 봅니다.",
                recommendedOrder: 4,
                reason: "배열 인덱스를 상태 공간으로 보는 연습에 좋습니다.",
                required: false
            }
        ]
    },
    {
        slug: "dp",
        name: "DP",
        description: "동적 계획법입니다. 상태 정의와 점화식 설계가 핵심이며, 중복 부분 문제를 저장해 해결합니다.",
        category: "DP",
        difficulty: "Hard",
        totalProblems: 174,
        solvedProblems: 24,
        wrongProblems: 18,
        reviewProblems: 16,
        accuracy: 52.1,
        status: "weak",
        recommended: true,
        featured: true,
        updatedAt: "2026-05-03",
        updatedAtText: "2026.05.03",
        relatedTags: ["knapsack", "lis", "memoization", "dynamic-programming"],
        aliases: ["Dynamic Programming", "동적 계획법", "메모이제이션"],
        guide: [
            "dp 배열의 의미를 먼저 문장으로 정의합니다.",
            "기저 상태를 명확하게 초기화합니다.",
            "현재 상태가 이전 어떤 상태에서 오는지 확인합니다.",
            "1차원 최적화 시 갱신 방향을 반드시 확인합니다."
        ],
        concepts: ["State", "Transition", "Base case", "Memoization", "Bottom-up"],
        mistakes: [
            "dp[i]의 의미를 정의하지 않고 점화식부터 작성함",
            "초기값을 누락함",
            "0/1 배낭에서 무게를 앞에서 뒤로 갱신해 같은 물건이 중복 선택됨",
            "배열 범위를 하나 작게 잡아 마지막 상태가 누락됨"
        ],
        learningPath: [
            { title: "1로 만들기", description: "가장 기본적인 최소 연산 DP를 연습합니다.", href: "/problems/1463" },
            { title: "LIS", description: "부분 수열 상태 정의를 연습합니다.", href: "/problems/11053" },
            { title: "평범한 배낭", description: "0/1 배낭과 갱신 방향을 정리합니다.", href: "/problems/12865" }
        ],
        problems: [
            {
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
                reason: "상태 정의와 기본 점화식 연습에 좋습니다.",
                required: true
            },
            {
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
                reason: "부분 수열 DP의 대표 문제입니다.",
                required: true
            },
            {
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
                reason: "0/1 배낭에서 갱신 방향을 확인하기 좋습니다.",
                required: true
            }
        ]
    },
    {
        slug: "implementation",
        name: "구현",
        description: "문제 조건을 정확히 코드로 옮기는 기본 유형입니다. 입출력, 조건 처리, 반복문, 시뮬레이션의 기반이 됩니다.",
        category: "기초",
        difficulty: "Easy",
        totalProblems: 286,
        solvedProblems: 94,
        wrongProblems: 12,
        reviewProblems: 8,
        accuracy: 81.3,
        status: "strong",
        recommended: true,
        featured: true,
        updatedAt: "2026-05-03",
        updatedAtText: "2026.05.03",
        relatedTags: ["simulation", "array", "string", "math"],
        aliases: ["Implementation", "구현", "시뮬레이션 기초"],
        guide: [
            "입출력 형식을 먼저 확인합니다.",
            "조건을 빠뜨리지 않도록 예외 케이스를 적어둡니다.",
            "반복문 범위와 인덱스 시작점을 주의합니다.",
            "출력 공백과 줄바꿈을 마지막에 확인합니다."
        ],
        concepts: ["Input/Output", "Loop", "Condition", "Array", "Simulation"],
        mistakes: [
            "출력 형식의 공백과 줄바꿈을 틀림",
            "반복문 범위가 하나 작거나 큼",
            "예외 조건을 하나 누락함",
            "입력 개수와 실제 파싱 개수가 맞지 않음"
        ],
        learningPath: [
            { title: "두 수의 합", description: "기본 입출력과 사칙연산을 확인합니다.", href: "/problems/1000" },
            { title: "X보다 작은 수", description: "반복문과 조건 출력 연습입니다.", href: "/problems/10871" },
            { title: "문자열 반복", description: "문자 단위 반복 처리를 연습합니다.", href: "/problems/2675" }
        ],
        problems: [
            {
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
                reason: "기본 입출력 확인용 문제입니다.",
                required: true
            },
            {
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
                reason: "조건문과 배열 순회를 함께 연습합니다.",
                required: true
            },
            {
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
                reason: "문자열 반복 출력 형식 연습에 좋습니다.",
                required: true
            }
        ]
    }
];

const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const STATUS_OPTIONS: readonly ProblemStatusFilter[] = ["전체", "해결", "오답", "미해결", "복습"];
const SORT_OPTIONS: readonly SortOption[] = ["recommended", "number-asc", "difficulty", "solved-rate", "score-desc", "status"];

const statusLabelToValue: Record<Exclude<ProblemStatusFilter, "전체">, ProblemStatus> = {
    해결: "solved",
    오답: "wrong",
    미해결: "todo",
    복습: "review"
};

const sortLabels: Record<SortOption, string> = {
    recommended: "추천 순서",
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

const tagStatusMeta: Record<TagStatus, { label: string; variant: "default" | "blue" | "green" | "red"; icon: ComponentType<{ className?: string }> }> = {
    "not-started": { label: "학습 전", variant: "default", icon: Compass },
    learning: { label: "학습 중", variant: "blue", icon: Target },
    strong: { label: "강점", variant: "green", icon: CheckCircle2 },
    weak: { label: "약점", variant: "red", icon: Flame }
};

function getTag(slug: string) {
    return TAGS.find((tag) => tag.slug.toLowerCase() === slug.toLowerCase());
}

function getProgress(tag: TagDetail) {
    return Math.round((tag.solvedProblems / Math.max(tag.totalProblems, 1)) * 100);
}

function getNextProblem(tag: TagDetail) {
    return tag.problems.find((problem) => problem.status !== "solved") ?? tag.problems[0];
}

function TagStatusBadge({ status }: { status: TagStatus }) {
    const meta = tagStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function GuidePanel({ title, items, icon: Icon }: { title: string; items: string[]; icon: ComponentType<{ className?: string }> }) {
    return (
        <SidePanel title={title} badge={<Icon className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-600">{index + 1}</span>
                        {item}
                    </div>
                ))}
            </div>
        </SidePanel>
    );
}

function LearningPathPanel({ tag }: { tag: TagDetail }) {
    return (
        <SidePanel title="학습 흐름" badge={<Route className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {tag.learningPath.map((item, index) => (
                    <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                            {index + 1}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-5 text-slate-400">{item.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function RepresentativeProblemPanel({ tag }: { tag: TagDetail }) {
    return (
        <SidePanel title="대표 문제" badge={<BookOpen className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {tag.problems.slice(0, 5).map((problem) => (
                    <Link key={problem.id} href={`/problems/${problem.id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${problem.status === "solved" ? "bg-emerald-100 text-emerald-700" : problem.status === "wrong" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-500"}`}>
                            {problem.recommendedOrder}
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

function RelatedTagsPanel({ tag }: { tag: TagDetail }) {
    return (
        <SidePanel title="관련 태그" badge={<Hash className="h-5 w-5 text-blue-600" />}>
            <div className="flex flex-wrap gap-2">
                {tag.relatedTags.map((related) => (
                    <Link key={related} href={`/tags/${related}`}>
                        <Badge>#{related}</Badge>
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

function NotFoundTag({ slug }: { slug: string }) {
    return (
        <AppShell title="태그를 찾을 수 없습니다" description="요청한 태그가 현재 로컬 데이터에 없습니다.">
            <EmptyState
                title={`#${slug} 태그를 찾을 수 없습니다.`}
                description="태그 이름을 다시 확인하거나 태그 목록으로 돌아가세요."
                icon={Search}
                action={
                    <AppLinkButton href="/tags" variant="dark" icon={ArrowLeft}>
                        태그 목록으로 돌아가기
                    </AppLinkButton>
                }
            />
        </AppShell>
    );
}

export default function TagDetailPage() {
    const params = useParams<{ tag: string }>();
    const slug = String(params.tag ?? "");
    const tag = getTag(decodeURIComponent(slug));

    const [keyword, setKeyword] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<ProblemStatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recommended");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    const filteredProblems = useMemo(() => {
        if (!tag) return [];

        const lowerKeyword = keyword.trim().toLowerCase();

        const result = tag.problems.filter((problem) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(problem.id).includes(lowerKeyword) ||
                problem.title.toLowerCase().includes(lowerKeyword) ||
                problem.category.toLowerCase().includes(lowerKeyword) ||
                problem.memo?.toLowerCase().includes(lowerKeyword) ||
                problem.reason.toLowerCase().includes(lowerKeyword) ||
                problem.tags?.some((item) => item.toLowerCase().includes(lowerKeyword));

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
                case "recommended":
                default:
                    return a.recommendedOrder - b.recommendedOrder;
            }
        });
    }, [tag, keyword, difficulty, status, sort]);

    if (!tag) {
        return <NotFoundTag slug={slug} />;
    }

    const progress = getProgress(tag);
    const solvedInList = tag.problems.filter((problem) => problem.status === "solved").length;
    const wrongInList = tag.problems.filter((problem) => problem.status === "wrong").length;
    const reviewInList = tag.problems.filter((problem) => problem.status === "review").length;
    const nextProblem = getNextProblem(tag);
    const totalScore = tag.problems.reduce((sum, problem) => sum + (problem.score ?? 0), 0);

    const resetFilters = () => {
        setKeyword("");
        setDifficulty("전체");
        setStatus("전체");
        setSort("recommended");
    };

    return (
        <AppShell title={`#${tag.name}`} description={`${tag.category} · ${tag.difficulty} · ${tag.totalProblems}문제`}>
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link href="/tags" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                태그 목록
                            </Link>
                            <Badge variant="blue">Tag</Badge>
                            <Badge>{tag.category}</Badge>
                            <DifficultyBadge value={tag.difficulty} />
                            <TagStatusBadge status={tag.status} />
                            {tag.featured && <Badge variant="amber"><Flame className="mr-1 h-3.5 w-3.5" />Featured</Badge>}
                        </>
                    }
                    title={`#${tag.name}`}
                    description={tag.description}
                    icon={Hash}
                    rightTitle="태그 진행률"
                    rightValue={`${progress}%`}
                    rightCaption={`${tag.solvedProblems} / ${tag.totalProblems} 문제 해결`}
                    metrics={[
                        { label: "정답률", value: `${tag.accuracy}%` },
                        { label: "오답", value: `${tag.wrongProblems}` },
                        { label: "복습", value: `${tag.reviewProblems}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href={`/problems/${nextProblem.id}/solve`} variant="primary" size="lg" iconRight={ArrowRight}>추천 문제 풀기</AppLinkButton>
                            <AppLinkButton href={`/problems?tag=${tag.slug}`} variant="white" size="lg" icon={BookOpen}>전체 문제 보기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 문제" value={tag.totalProblems.toLocaleString()} caption={`목록 표시 ${tag.problems.length}개`} icon={Database} tone="blue" />
                    <StatCard label="해결 문제" value={tag.solvedProblems.toLocaleString()} caption={`진행률 ${progress}%`} icon={CheckCircle2} tone="green" />
                    <StatCard label="정답률" value={`${tag.accuracy}%`} caption="태그 기준 정답률" icon={Gauge} tone="orange" />
                    <StatCard label="복습 필요" value={(tag.wrongProblems + tag.reviewProblems).toLocaleString()} caption="오답 + 복습" icon={Flame} tone="red" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <Card className="p-5">
                            <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
                                <div>
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {tag.aliases.map((alias) => <Badge key={alias}>{alias}</Badge>)}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-950">태그 소개</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-500">{tag.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {tag.concepts.map((concept) => <Badge key={concept} variant="blue">{concept}</Badge>)}
                                    </div>
                                </div>
                                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                    <p className="text-sm font-black text-slate-300">학습 진행률</p>
                                    <p className="mt-1 text-5xl font-black">{progress}%</p>
                                    <ProgressBar value={progress} className="mt-5 bg-white/10" />
                                </div>
                            </div>
                        </Card>

                        <FilterPanel
                            title="태그 문제 검색 / 필터"
                            onReset={resetFilters}
                            gridClassName="grid gap-3 xl:grid-cols-[1.4fr_160px_160px_190px_auto] xl:items-end"
                        >
                            <SearchInput value={keyword} onChange={setKeyword} placeholder="문제 번호, 제목, 태그, 메모, 추천 이유 검색" />
                            <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                            <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                            <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                        </FilterPanel>

                        <section className="space-y-4">
                            <ListHeader
                                title="태그 문제 목록"
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
                        <SidePanel title="태그 요약" badge={<BarChart3 className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">진행률</p>
                                <p className="mt-1 text-5xl font-black">{progress}%</p>
                                <ProgressBar value={progress} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="해결" value={`${solvedInList}`} />
                                <MiniStat label="오답" value={`${wrongInList}`} />
                                <MiniStat label="복습" value={`${reviewInList}`} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <MiniStat label="총점" value={`${totalScore}`} />
                                <MiniStat label="난이도" value={tag.difficulty} />
                            </div>
                        </SidePanel>

                        <GuidePanel title="학습 가이드" items={tag.guide} icon={Lightbulb} />
                        <GuidePanel title="자주 하는 실수" items={tag.mistakes} icon={Flame} />
                        <LearningPathPanel tag={tag} />
                        <RepresentativeProblemPanel tag={tag} />
                        <RelatedTagsPanel tag={tag} />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href={`/problems/${nextProblem.id}/solve`} label="추천 문제 풀기" icon={Target} />
                                <QuickLink href={`/problems?tag=${tag.slug}`} label="이 태그 전체 문제" icon={BookOpen} />
                                <QuickLink href="/tags" label="태그 목록" icon={Hash} />
                                <QuickLink href="/sets" label="문제 세트" icon={Layers3} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/ranking" label="랭킹" icon={Trophy} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/tags/[tag]`는 샘플 태그 데이터 기반입니다. API는 `GET /api/tags/:tag`, `GET /api/tags/:tag/problems`, `GET /api/problems?tag=:tag`를 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
