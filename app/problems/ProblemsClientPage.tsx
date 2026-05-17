"use client";

import AppShell from "@/components/layout/AppShell";
import {
    AppLinkButton,
    Badge,
    Card,
    EmptyState,
    PageHero,
    StatCard,
} from "@/components/ui";
import {
    FilterPanel,
    FilterSelect,
    SearchInput,
} from "@/components/forms";
import {
    ListHeader,
    ViewModeToggle,
    type ViewMode,
} from "@/components/common";
import {
    ProblemCard,
    ProblemTable,
    type Difficulty,
    type ProblemCardData,
    type ProblemStatus,
} from "@/components/domain";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Database,
    Hash,
    Search,
    Sparkles,
    Target,
    Trophy,
} from "lucide-react";

type ProblemCategory =
    | "전체"
    | "구현"
    | "자료구조"
    | "그래프"
    | "DP"
    | "문자열"
    | "수학";

type DifficultyFilter = "전체" | Difficulty;
type StatusFilter = "전체" | "해결" | "오답" | "미해결" | "복습";

type SortOption =
    | "recommended"
    | "number-asc"
    | "number-desc"
    | "difficulty"
    | "solved-rate"
    | "score-desc";

type Problem = ProblemCardData & {
    category: string;
    source: string;
};

type ApiProblem = Partial<ProblemCardData> & {
    dbId?: number;
    number?: number;
    problemNumber?: number;
    title?: string;
    difficulty?: string;
    category?: string;
    score?: number;
    status?: string;
    solvedRate?: number;
    submissions?: number;
    accepted?: number;
    timeLimit?: string;
    memoryLimit?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
    tags?: string[];
    memo?: string;
    note?: string;
    recommendedOrder?: number;
    source?: string;
};

type ProblemsApiResponse = {
    ok?: boolean;
    message?: string;
    problems?: ApiProblem[];
};

const CATEGORY_OPTIONS: readonly ProblemCategory[] = [
    "전체",
    "구현",
    "자료구조",
    "그래프",
    "DP",
    "문자열",
    "수학",
];

const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = [
    "전체",
    "Easy",
    "Medium",
    "Hard",
];

const STATUS_OPTIONS: readonly StatusFilter[] = [
    "전체",
    "해결",
    "오답",
    "미해결",
    "복습",
];

const SORT_OPTIONS: readonly SortOption[] = [
    "recommended",
    "number-asc",
    "number-desc",
    "difficulty",
    "solved-rate",
    "score-desc",
];

const statusLabelToValue: Record<Exclude<StatusFilter, "전체">, ProblemStatus> = {
    해결: "solved",
    오답: "wrong",
    미해결: "todo",
    복습: "review",
};

const difficultyOrder: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

const sortLabels: Record<SortOption, string> = {
    recommended: "추천순",
    "number-asc": "번호 낮은순",
    "number-desc": "번호 높은순",
    difficulty: "난이도순",
    "solved-rate": "정답률 높은순",
    "score-desc": "점수 높은순",
};

function normalizeKeyword(value: string) {
    return value.trim().toLowerCase();
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
    const text = String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    switch (text) {
        case "solved":
        case "accepted":
        case "ac":
            return "solved";

        case "wrong":
        case "wronganswer":
        case "wa":
            return "wrong";

        case "review":
            return "review";

        case "todo":
        case "unsolved":
        case "published":
        case "draft":
        case "archived":
        default:
            return "todo";
    }
}

function formatTimeLimitFromMs(ms?: number) {
    const value = Number(ms);

    if (!Number.isFinite(value) || value <= 0) return "1초";
    if (value % 1000 === 0) return `${value / 1000}초`;

    return `${value}ms`;
}

function formatMemoryLimitFromMb(mb?: number) {
    const value = Number(mb);

    if (!Number.isFinite(value) || value <= 0) return "256MB";

    return `${value}MB`;
}

function normalizeProblemFromApi(problem: ApiProblem): Problem {
    const id = Number(
        problem.id ??
            problem.number ??
            problem.problemNumber ??
            0,
    );

    const timeLimitMs = Number(problem.timeLimitMs ?? 1000);
    const memoryLimitMb = Number(problem.memoryLimitMb ?? 256);

    return {
        id,
        title: problem.title ?? "제목 없음",
        difficulty: normalizeDifficulty(problem.difficulty),
        category: problem.category ?? "구현",
        score: Number(problem.score ?? 100),
        status: normalizeProblemStatus(problem.status),
        solvedRate: Number(problem.solvedRate ?? 0),
        submissions: Number(problem.submissions ?? 0),
        timeLimit: problem.timeLimit ?? formatTimeLimitFromMs(timeLimitMs),
        memoryLimit:
            problem.memoryLimit ?? formatMemoryLimitFromMb(memoryLimitMb),
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        memo: problem.memo ?? problem.note ?? "",
        recommendedOrder: Number(problem.recommendedOrder ?? id),
        source: problem.source ?? "DB",
    };
}

function matchesTag(problem: Problem, tag: string) {
    if (!tag) {
        return true;
    }

    return (
        problem.tags?.some(
            (item) => item.toLowerCase() === tag.toLowerCase(),
        ) ?? false
    );
}

async function fetchProblems(): Promise<Problem[]> {
    const response = await fetch("/api/problems", {
        method: "GET",
        cache: "no-store",
    });

    const data = (await response.json()) as ProblemsApiResponse;

    if (!response.ok || data.ok === false) {
        throw new Error(
            data.message ??
                `문제 목록을 불러오지 못했습니다. (${response.status})`,
        );
    }

    return Array.isArray(data.problems)
        ? data.problems.map(normalizeProblemFromApi)
        : [];
}

export default function ProblemsClientPage() {
    const searchParams = useSearchParams();
    const queryTag = searchParams.get("tag") ?? "";

    const [problems, setProblems] = useState<Problem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState<ProblemCategory>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [status, setStatus] = useState<StatusFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recommended");
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                setIsLoading(true);
                setErrorMessage("");

                const items = await fetchProblems();

                if (ignore) return;

                setProblems(items);
            } catch (error) {
                if (ignore) return;

                console.error("Failed to load /api/problems", error);
                setProblems([]);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "문제 목록을 불러오지 못했습니다.",
                );
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const filteredProblems = useMemo(() => {
        const lowerKeyword = normalizeKeyword(keyword);

        const result = problems.filter((problem) => {
            const matchesKeyword =
                !lowerKeyword ||
                String(problem.id).includes(lowerKeyword) ||
                problem.title.toLowerCase().includes(lowerKeyword) ||
                problem.category.toLowerCase().includes(lowerKeyword) ||
                problem.memo?.toLowerCase().includes(lowerKeyword) ||
                problem.tags?.some((tag) =>
                    tag.toLowerCase().includes(lowerKeyword),
                );

            const matchesCategory =
                category === "전체" || problem.category === category;

            const matchesDifficulty =
                difficulty === "전체" || problem.difficulty === difficulty;

            const matchesStatus =
                status === "전체" || problem.status === statusLabelToValue[status];

            const matchesQueryTag = matchesTag(problem, queryTag);

            return (
                matchesKeyword &&
                matchesCategory &&
                matchesDifficulty &&
                matchesStatus &&
                matchesQueryTag
            );
        });

        return [...result].sort((a, b) => {
            switch (sort) {
                case "number-asc":
                    return a.id - b.id;

                case "number-desc":
                    return b.id - a.id;

                case "difficulty":
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];

                case "solved-rate":
                    return (b.solvedRate ?? 0) - (a.solvedRate ?? 0);

                case "score-desc":
                    return (b.score ?? 0) - (a.score ?? 0);

                case "recommended":
                default:
                    return (
                        (a.recommendedOrder ?? 9999) -
                        (b.recommendedOrder ?? 9999)
                    );
            }
        });
    }, [problems, keyword, category, difficulty, status, sort, queryTag]);

    const solvedCount = problems.filter(
        (problem) => problem.status === "solved",
    ).length;

    const wrongCount = problems.filter(
        (problem) => problem.status === "wrong",
    ).length;

    const reviewCount = problems.filter(
        (problem) => problem.status === "review",
    ).length;

    const hardCount = problems.filter(
        (problem) => problem.difficulty === "Hard",
    ).length;

    const averageSolvedRate =
        problems.length === 0
            ? 0
            : Math.round(
                  (problems.reduce(
                      (sum, problem) => sum + (problem.solvedRate ?? 0),
                      0,
                  ) /
                      problems.length) *
                      10,
              ) / 10;

    const tagCount = Array.from(
        new Set(problems.flatMap((problem) => problem.tags ?? [])),
    ).length;

    const recommendedProblemId =
        filteredProblems[0]?.id ?? problems[0]?.id ?? 1000;

    const resetFilters = () => {
        setKeyword("");
        setCategory("전체");
        setDifficulty("전체");
        setStatus("전체");
        setSort("recommended");
    };

    return (
        <AppShell
            title="문제 검색"
            description="로컬 DB에 저장된 문제를 검색하고 풀이할 수 있습니다."
        >
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Problems</Badge>
                            <Badge>DB Dataset</Badge>
                            {queryTag && (
                                <Badge variant="green">#{queryTag}</Badge>
                            )}
                        </>
                    }
                    title="문제를 찾고, 바로 풀이를 시작하세요."
                    description="번호, 제목, 태그, 분류, 난이도, 풀이 상태를 기준으로 문제를 빠르게 찾을 수 있습니다."
                    icon={BookOpen}
                    rightTitle="검색 대상 문제"
                    rightValue={
                        isLoading
                            ? "불러오는 중"
                            : problems.length.toLocaleString()
                    }
                    rightCaption={`평균 정답률 ${averageSolvedRate}%`}
                    metrics={[
                        { label: "해결", value: `${solvedCount}` },
                        { label: "오답", value: `${wrongCount}` },
                        { label: "Hard", value: `${hardCount}` },
                    ]}
                    actions={
                        <>
                            <AppLinkButton
                                href={`/problems/${recommendedProblemId}/solve`}
                                variant="primary"
                                size="lg"
                                iconRight={ArrowRight}
                            >
                                추천 문제 풀기
                            </AppLinkButton>

                            <AppLinkButton href="/sets" variant="white" size="lg">
                                문제 세트 보기
                            </AppLinkButton>
                        </>
                    }
                />

                {errorMessage && (
                    <Card className="border-red-100 bg-red-50 p-5">
                        <p className="font-black text-red-700">
                            문제 목록 API 오류
                        </p>
                        <p className="mt-1 text-sm font-bold text-red-500">
                            {errorMessage}
                        </p>
                    </Card>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="전체 문제"
                        value={
                            isLoading
                                ? "-"
                                : problems.length.toLocaleString()
                        }
                        caption="DB Problem 테이블 기준"
                        icon={Database}
                    />

                    <StatCard
                        label="해결 문제"
                        value={solvedCount.toLocaleString()}
                        caption="현재 사용자 기준"
                        icon={CheckCircle2}
                        tone="green"
                    />

                    <StatCard
                        label="복습 필요"
                        value={(wrongCount + reviewCount).toLocaleString()}
                        caption="오답 또는 복습 상태"
                        icon={Clock3}
                        tone="orange"
                    />

                    <StatCard
                        label="태그 수"
                        value={tagCount.toLocaleString()}
                        caption="문제 분류 태그"
                        icon={Hash}
                        tone="blue"
                    />
                </section>

                <FilterPanel
                    title="문제 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_150px_150px_150px_180px_auto] xl:items-end"
                >
                    <SearchInput
                        value={keyword}
                        onChange={setKeyword}
                        placeholder="문제 번호, 제목, 태그, 메모 검색"
                    />

                    <FilterSelect
                        label="분류"
                        value={category}
                        onChange={setCategory}
                        options={CATEGORY_OPTIONS}
                    />

                    <FilterSelect
                        label="난이도"
                        value={difficulty}
                        onChange={setDifficulty}
                        options={DIFFICULTY_OPTIONS}
                    />

                    <FilterSelect
                        label="상태"
                        value={status}
                        onChange={setStatus}
                        options={STATUS_OPTIONS}
                    />

                    <FilterSelect
                        label="정렬"
                        value={sort}
                        onChange={setSort}
                        options={SORT_OPTIONS}
                    />
                </FilterPanel>

                <section>
                    <ListHeader
                        title="문제 목록"
                        description={
                            isLoading
                                ? "DB에서 문제 목록을 불러오는 중입니다."
                                : `검색 조건에 맞는 문제 ${filteredProblems.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`
                        }
                        right={
                            <ViewModeToggle
                                value={viewMode}
                                onChange={setViewMode}
                            />
                        }
                    />

                    {isLoading ? (
                        <Card className="p-6">
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                                <Database className="h-5 w-5" />
                                문제 목록을 불러오는 중입니다.
                            </div>
                        </Card>
                    ) : errorMessage ? (
                        <Card className="border-red-100 bg-red-50 p-5">
                            <p className="font-black text-red-700">
                                문제 목록을 표시할 수 없습니다.
                            </p>
                            <p className="mt-1 text-sm font-bold text-red-500">
                                {errorMessage}
                            </p>
                        </Card>
                    ) : filteredProblems.length === 0 ? (
                        <EmptyState
                            title="문제를 찾을 수 없습니다."
                            description="DB에 문제가 없거나 검색어, 필터 또는 태그 조건에 맞는 문제가 없습니다."
                            icon={Search}
                            onReset={resetFilters}
                        />
                    ) : viewMode === "card" ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {filteredProblems.map((problem) => (
                                <ProblemCard
                                    key={problem.id}
                                    problem={problem}
                                />
                            ))}
                        </div>
                    ) : (
                        <ProblemTable problems={filteredProblems} />
                    )}
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <Card className="p-5">
                        <div className="mb-3 flex items-center gap-2 font-black text-slate-950">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            추천 흐름
                        </div>
                        <p className="text-sm leading-7 text-slate-500">
                            처음에는 Easy 구현 문제를 풀고, 이후 스택/큐, BFS, DP 순서로 확장하는 흐름이 좋습니다.
                        </p>
                    </Card>

                    <Card className="p-5">
                        <div className="mb-3 flex items-center gap-2 font-black text-slate-950">
                            <Target className="h-5 w-5 text-blue-600" />
                            오늘 목표
                        </div>
                        <p className="text-sm leading-7 text-slate-500">
                            현재 화면은 `/api/problems` DB API 응답을 기준으로 문제 목록을 표시합니다.
                        </p>
                    </Card>

                    <Card className="p-5">
                        <div className="mb-3 flex items-center gap-2 font-black text-slate-950">
                            <Trophy className="h-5 w-5 text-blue-600" />
                            실전 대비
                        </div>
                        <p className="text-sm leading-7 text-slate-500">
                            문제 검색에 익숙해지면 `/tests`에서 제한 시간 기반 모의 테스트를 진행하면 됩니다.
                        </p>
                    </Card>
                </section>
            </div>
        </AppShell>
    );
}