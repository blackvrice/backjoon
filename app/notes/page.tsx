"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
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
    ProblemStatusBadge,
    type Difficulty,
    type ProblemStatus
} from "@/components/domain";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Copy,
    Edit3,
    FileCode2,
    FileText,
    Flame,
    Gauge,
    Hash,
    History,
    Layers3,
    Lightbulb,
    ListChecks,
    NotebookPen,
    Pin,
    Plus,
    RefreshCcw,
    RotateCcw,
    Search,
    Sparkles,
    Star,
    Target,
    Terminal,
    Timer,
    Trash2,
    Trophy,
    Zap
} from "lucide-react";

type NoteType = "wrong-answer" | "concept" | "template" | "review" | "idea";
type NoteTypeFilter = "전체" | "오답" | "개념" | "템플릿" | "복습" | "아이디어";
type NoteStatus = "draft" | "active" | "reviewing" | "done";
type NoteStatusFilter = "전체" | "작성 중" | "활성" | "복습 중" | "완료";
type ReviewLevel = "low" | "medium" | "high";
type ReviewLevelFilter = "전체" | "낮음" | "보통" | "높음";
type DifficultyFilter = "전체" | Difficulty;
type SortOption = "recent" | "priority" | "review-date" | "title" | "problem" | "created";

type NoteItem = {
    id: string;
    title: string;
    summary: string;
    type: NoteType;
    status: NoteStatus;
    reviewLevel: ReviewLevel;
    problemId?: number;
    problemTitle?: string;
    problemDifficulty?: Difficulty;
    problemStatus?: ProblemStatus;
    submissionId?: number;
    relatedHref: string;
    solveHref?: string;
    tags: string[];
    cause: string;
    fix: string;
    learned: string;
    codeSnippet?: string;
    createdAt: string;
    createdAtText: string;
    updatedAt: string;
    updatedAtText: string;
    nextReviewAt: string;
    nextReviewAtText: string;
    reviewCount: number;
    pinned: boolean;
};

const notes: NoteItem[] = [
    {
        id: "note-knapsack-direction",
        title: "0/1 배낭 갱신 방향 정리",
        summary: "1차원 DP에서 무게를 뒤에서 앞으로 갱신해야 같은 물건이 중복 선택되지 않습니다.",
        type: "wrong-answer",
        status: "reviewing",
        reviewLevel: "high",
        problemId: 12865,
        problemTitle: "평범한 배낭",
        problemDifficulty: "Hard",
        problemStatus: "wrong",
        submissionId: 202605030004,
        relatedHref: "/problems/12865",
        solveHref: "/problems/12865/solve",
        tags: ["DP", "Knapsack", "1D DP"],
        cause: "1차원 DP에서 weight를 작은 값부터 증가시키며 갱신해서 같은 물건이 한 번의 루프 안에서 다시 선택되었습니다.",
        fix: "0/1 배낭은 각 물건을 한 번만 사용할 수 있으므로 weight를 K에서 W까지 감소시키며 갱신합니다.",
        learned: "DP 배열의 의미와 현재 루프에서 재사용 가능한 상태인지 먼저 확인해야 합니다.",
        codeSnippet: `for (int weight = k; weight >= w; weight--) {
    dp[weight] = max(dp[weight], dp[weight - w] + v);
}`,
        createdAt: "2026-05-03T13:10:00",
        createdAtText: "2026.05.03 13:10",
        updatedAt: "2026-05-03T13:40:00",
        updatedAtText: "2026.05.03 13:40",
        nextReviewAt: "2026-05-04",
        nextReviewAtText: "2026.05.04",
        reviewCount: 2,
        pinned: true
    },
    {
        id: "note-multi-source-bfs",
        title: "다중 시작점 BFS 큐 초기화",
        summary: "토마토 문제처럼 시작점이 여러 개인 경우 모든 시작점을 큐에 먼저 넣고 BFS를 시작합니다.",
        type: "wrong-answer",
        status: "active",
        reviewLevel: "high",
        problemId: 7576,
        problemTitle: "토마토",
        problemDifficulty: "Medium",
        problemStatus: "wrong",
        submissionId: 202605030014,
        relatedHref: "/problems/7576",
        solveHref: "/problems/7576/solve",
        tags: ["BFS", "Queue", "Graph", "Grid"],
        cause: "처음 익은 토마토를 하나만 시작점으로 처리해서 동시에 퍼지는 상황을 반영하지 못했습니다.",
        fix: "입력 단계에서 값이 1인 모든 좌표를 큐에 push한 뒤 BFS를 수행합니다.",
        learned: "동시에 퍼지는 문제는 다중 시작점 BFS로 모델링해야 합니다.",
        codeSnippet: `if (box[y][x] == 1) {
    q.push({y, x});
}`,
        createdAt: "2026-05-02T20:10:00",
        createdAtText: "2026.05.02 20:10",
        updatedAt: "2026-05-03T12:02:00",
        updatedAtText: "2026.05.03 12:02",
        nextReviewAt: "2026-05-04",
        nextReviewAtText: "2026.05.04",
        reviewCount: 3,
        pinned: true
    },
    {
        id: "note-bfs-visited-timing",
        title: "BFS 방문 처리는 큐에 넣는 순간",
        summary: "방문 처리를 큐에서 꺼낼 때 하면 같은 노드가 중복 삽입될 수 있습니다.",
        type: "concept",
        status: "active",
        reviewLevel: "medium",
        problemId: 2178,
        problemTitle: "미로 탐색",
        problemDifficulty: "Medium",
        problemStatus: "todo",
        relatedHref: "/tags/bfs",
        solveHref: "/problems/2178/solve",
        tags: ["BFS", "Visited", "Grid"],
        cause: "방문 타이밍을 늦추면 여러 부모 노드에서 같은 좌표를 큐에 넣을 수 있습니다.",
        fix: "다음 좌표가 유효하고 아직 방문하지 않았다면 큐에 넣기 전에 visited 또는 distance 값을 기록합니다.",
        learned: "BFS에서 중복 방문을 막는 가장 안전한 시점은 enqueue 직전입니다.",
        codeSnippet: `if (!visited[ny][nx]) {
    visited[ny][nx] = true;
    q.push({ny, nx});
}`,
        createdAt: "2026-05-01T09:30:00",
        createdAtText: "2026.05.01 09:30",
        updatedAt: "2026-05-03T09:10:00",
        updatedAtText: "2026.05.03 09:10",
        nextReviewAt: "2026-05-06",
        nextReviewAtText: "2026.05.06",
        reviewCount: 1,
        pinned: false
    },
    {
        id: "note-fast-io-cpp",
        title: "C++ 빠른 입출력 템플릿",
        summary: "입출력이 많은 문제에서는 sync 해제와 tie 해제를 기본 템플릿에 포함합니다.",
        type: "template",
        status: "done",
        reviewLevel: "low",
        relatedHref: "/problems",
        tags: ["C++17", "IO", "Template"],
        cause: "입출력 양이 많은 자료구조 문제에서 시간 초과가 발생할 수 있습니다.",
        fix: "ios::sync_with_stdio(false), cin.tie(nullptr)를 main 시작에 배치합니다.",
        learned: "endl은 flush가 포함되므로 대량 출력에서는 '\\n'을 사용합니다.",
        codeSnippet: `ios::sync_with_stdio(false);
cin.tie(nullptr);`,
        createdAt: "2026-04-29T14:00:00",
        createdAtText: "2026.04.29 14:00",
        updatedAt: "2026-05-01T08:20:00",
        updatedAtText: "2026.05.01 08:20",
        nextReviewAt: "2026-05-10",
        nextReviewAtText: "2026.05.10",
        reviewCount: 0,
        pinned: false
    },
    {
        id: "note-stack-command-pattern",
        title: "스택 명령 처리 패턴",
        summary: "push, pop, top, size, empty 명령을 문자열 분기와 배열/vector로 빠르게 처리합니다.",
        type: "template",
        status: "done",
        reviewLevel: "low",
        problemId: 10828,
        problemTitle: "스택 명령 처리",
        problemDifficulty: "Medium",
        problemStatus: "solved",
        submissionId: 202605030002,
        relatedHref: "/problems/10828",
        solveHref: "/problems/10828/solve",
        tags: ["Stack", "Data Structure", "Command"],
        cause: "명령 처리 문제에서 pop/top의 빈 스택 예외 처리를 누락하기 쉽습니다.",
        fix: "명령별 분기를 만들고 empty 상태를 먼저 검사합니다.",
        learned: "자료구조 명령 문제는 예외 조건을 함수로 분리하면 실수가 줄어듭니다.",
        codeSnippet: `if (cmd == "pop") {
    if (st.empty()) cout << -1 << '\n';
    else { cout << st.back() << '\n'; st.pop_back(); }
}`,
        createdAt: "2026-04-28T18:10:00",
        createdAtText: "2026.04.28 18:10",
        updatedAt: "2026-05-03T10:42:00",
        updatedAtText: "2026.05.03 10:42",
        nextReviewAt: "2026-05-12",
        nextReviewAtText: "2026.05.12",
        reviewCount: 1,
        pinned: false
    },
    {
        id: "note-lis-state-definition",
        title: "LIS DP 상태 정의",
        summary: "dp[i]를 i번째 원소를 마지막으로 하는 증가 부분 수열의 최대 길이로 정의합니다.",
        type: "concept",
        status: "reviewing",
        reviewLevel: "medium",
        problemId: 11053,
        problemTitle: "가장 긴 증가하는 부분 수열",
        problemDifficulty: "Medium",
        problemStatus: "solved",
        relatedHref: "/problems/11053",
        solveHref: "/problems/11053/solve",
        tags: ["DP", "LIS", "State"],
        cause: "dp[i]의 의미를 전체 구간의 최댓값으로 착각하면 점화식이 흐려집니다.",
        fix: "dp[i]는 i를 반드시 포함하는 상태로 정의하고, 마지막에 max(dp)를 답으로 사용합니다.",
        learned: "DP는 배열의 의미를 한 문장으로 먼저 정의해야 합니다.",
        codeSnippet: `for (int i = 0; i < n; i++) {
    dp[i] = 1;
    for (int j = 0; j < i; j++) {
        if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + 1);
    }
}`,
        createdAt: "2026-04-27T16:20:00",
        createdAtText: "2026.04.27 16:20",
        updatedAt: "2026-05-02T11:30:00",
        updatedAtText: "2026.05.02 11:30",
        nextReviewAt: "2026-05-05",
        nextReviewAtText: "2026.05.05",
        reviewCount: 2,
        pinned: false
    },
    {
        id: "note-test-time-strategy",
        title: "모의 테스트 시간 배분 전략",
        summary: "처음 10분은 전체 문제를 훑고, 쉬운 문제부터 점수를 확보한 뒤 어려운 문제로 이동합니다.",
        type: "idea",
        status: "active",
        reviewLevel: "medium",
        relatedHref: "/tests/coding-test-practice-1/result",
        solveHref: "/tests/coding-test-practice-1/solve",
        tags: ["Mock Test", "Strategy", "Time"],
        cause: "어려운 DP 문제에 시간을 과하게 써서 쉬운 BFS 문제를 제출하지 못했습니다.",
        fix: "문제 난이도와 배점을 먼저 보고 1차 풀이 순서를 정합니다.",
        learned: "실전에서는 완벽한 풀이보다 점수 확보 순서가 중요합니다.",
        createdAt: "2026-05-03T10:55:00",
        createdAtText: "2026.05.03 10:55",
        updatedAt: "2026-05-03T11:05:00",
        updatedAtText: "2026.05.03 11:05",
        nextReviewAt: "2026-05-06",
        nextReviewAtText: "2026.05.06",
        reviewCount: 0,
        pinned: true
    }
];

const DEFAULT_notes = notes;

const TYPE_OPTIONS: readonly NoteTypeFilter[] = ["전체", "오답", "개념", "템플릿", "복습", "아이디어"];
const STATUS_OPTIONS: readonly NoteStatusFilter[] = ["전체", "작성 중", "활성", "복습 중", "완료"];
const REVIEW_OPTIONS: readonly ReviewLevelFilter[] = ["전체", "낮음", "보통", "높음"];
const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ["전체", "Easy", "Medium", "Hard"];
const SORT_OPTIONS: readonly SortOption[] = ["recent", "priority", "review-date", "title", "problem", "created"];

const typeLabelToValue: Record<Exclude<NoteTypeFilter, "전체">, NoteType> = {
    오답: "wrong-answer",
    개념: "concept",
    템플릿: "template",
    복습: "review",
    아이디어: "idea"
};

const statusLabelToValue: Record<Exclude<NoteStatusFilter, "전체">, NoteStatus> = {
    "작성 중": "draft",
    활성: "active",
    "복습 중": "reviewing",
    완료: "done"
};

const reviewLabelToValue: Record<Exclude<ReviewLevelFilter, "전체">, ReviewLevel> = {
    낮음: "low",
    보통: "medium",
    높음: "high"
};

const sortLabels: Record<SortOption, string> = {
    recent: "최근 수정순",
    priority: "복습 중요도순",
    "review-date": "복습일 빠른순",
    title: "제목순",
    problem: "문제 번호순",
    created: "작성일순"
};

const noteTypeMeta: Record<NoteType, { label: string; variant: "default" | "blue" | "green" | "orange" | "purple" | "red"; icon: ComponentType<{ className?: string }> }> = {
    "wrong-answer": { label: "오답", variant: "red", icon: RotateCcw },
    concept: { label: "개념", variant: "blue", icon: Lightbulb },
    template: { label: "템플릿", variant: "green", icon: Code2 },
    review: { label: "복습", variant: "orange", icon: RefreshCcw },
    idea: { label: "아이디어", variant: "purple", icon: Sparkles }
};

const noteStatusMeta: Record<NoteStatus, { label: string; variant: "default" | "blue" | "green" | "orange"; icon: ComponentType<{ className?: string }> }> = {
    draft: { label: "작성 중", variant: "default", icon: Edit3 },
    active: { label: "활성", variant: "blue", icon: FileText },
    reviewing: { label: "복습 중", variant: "orange", icon: RefreshCcw },
    done: { label: "완료", variant: "green", icon: CheckCircle2 }
};

const reviewMeta: Record<ReviewLevel, { label: string; variant: "default" | "orange" | "red"; order: number }> = {
    high: { label: "높음", variant: "red", order: 1 },
    medium: { label: "보통", variant: "orange", order: 2 },
    low: { label: "낮음", variant: "default", order: 3 }
};

const difficultyOrder: Record<Difficulty, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3
};

function NoteTypeBadge({ type }: { type: NoteType }) {
    const meta = noteTypeMeta[type];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function NoteStatusBadge({ status }: { status: NoteStatus }) {
    const meta = noteStatusMeta[status];
    const Icon = meta.icon;

    return (
        <Badge variant={meta.variant}>
            <Icon className="mr-1 h-3.5 w-3.5" />
            {meta.label}
        </Badge>
    );
}

function ReviewLevelBadge({ level }: { level: ReviewLevel }) {
    const meta = reviewMeta[level];
    return <Badge variant={meta.variant}>복습 {meta.label}</Badge>;
}

function NoteCard({ note, onCopy }: { note: NoteItem; onCopy: (code: string) => void }) {
    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <NoteTypeBadge type={note.type} />
                        <NoteStatusBadge status={note.status} />
                        <ReviewLevelBadge level={note.reviewLevel} />
                        {note.pinned && <Badge variant="orange"><Pin className="mr-1 h-3.5 w-3.5" />고정</Badge>}
                        {note.problemDifficulty && <DifficultyBadge value={note.problemDifficulty} />}
                        {note.problemStatus && <ProblemStatusBadge value={note.problemStatus} />}
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                            <NotebookPen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <Link href={note.relatedHref} className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                                {note.title}
                            </Link>
                            <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{note.summary}</p>
                        </div>
                    </div>

                    {note.problemId && (
                        <Link href={`/problems/${note.problemId}`} className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-100">
                            <span>{note.problemId}. {note.problemTitle}</span>
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    )}

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <NoteBlock title="원인" value={note.cause} />
                        <NoteBlock title="수정" value={note.fix} />
                        <NoteBlock title="배운 점" value={note.learned} />
                    </div>

                    {note.codeSnippet && (
                        <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950">
                            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                <span className="text-sm font-black text-slate-200">Code Snippet</span>
                                <button
                                    type="button"
                                    onClick={() => onCopy(note.codeSnippet ?? "")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/15"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    복사
                                </button>
                            </div>
                            <pre className="max-h-56 overflow-auto p-4 text-sm leading-7 text-slate-100"><code>{note.codeSnippet}</code></pre>
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                        {note.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                    </div>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="복습 횟수" value={`${note.reviewCount}회`} />
                    <MetricBox label="다음 복습" value={note.nextReviewAtText} />
                    <MetricBox label="작성" value={note.createdAtText.split(" ")[0]} />
                    <MetricBox label="수정" value={note.updatedAtText.split(" ")[0]} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">최근 수정 {note.updatedAtText}</div>
                <div className="flex flex-wrap gap-2">
                    <AppButton variant="secondary" icon={Edit3}>수정</AppButton>
                    {note.submissionId && <AppLinkButton href={`/submissions/${note.submissionId}`} variant="secondary" iconRight={ChevronRight}>제출 보기</AppLinkButton>}
                    {note.solveHref && <AppLinkButton href={note.solveHref} variant="primary" iconRight={ArrowRight}>다시 풀기</AppLinkButton>}
                </div>
            </div>
        </Card>
    );
}

function NoteBlock({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-2 text-sm font-black text-slate-950">{title}</p>
            <p className="line-clamp-4 text-sm leading-6 text-slate-500">{value}</p>
        </div>
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

function NotesTable({ items }: { items: NoteItem[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">노트</th>
                        <th className="px-5 py-4">유형</th>
                        <th className="px-5 py-4">상태</th>
                        <th className="px-5 py-4">복습</th>
                        <th className="px-5 py-4">문제</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4">태그</th>
                        <th className="px-5 py-4">다음 복습</th>
                        <th className="px-5 py-4">수정</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {items.map((note) => (
                        <tr key={note.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link href={note.relatedHref} className="font-black text-slate-950 transition hover:text-blue-600">
                                    {note.pinned && <Pin className="mr-1 inline h-3.5 w-3.5 text-orange-500" />}
                                    {note.title}
                                </Link>
                                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{note.summary}</p>
                            </td>
                            <td className="px-5 py-4"><NoteTypeBadge type={note.type} /></td>
                            <td className="px-5 py-4"><NoteStatusBadge status={note.status} /></td>
                            <td className="px-5 py-4"><ReviewLevelBadge level={note.reviewLevel} /></td>
                            <td className="px-5 py-4">
                                {note.problemId ? <Link href={`/problems/${note.problemId}`} className="font-bold text-blue-600 hover:text-blue-700">#{note.problemId}</Link> : <Badge>-</Badge>}
                            </td>
                            <td className="px-5 py-4">{note.problemDifficulty ? <DifficultyBadge value={note.problemDifficulty} /> : <Badge>-</Badge>}</td>
                            <td className="px-5 py-4">
                                <div className="flex max-w-[240px] flex-wrap gap-1.5">
                                    {note.tags.slice(0, 3).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                                    {note.tags.length > 3 && <Badge>+{note.tags.length - 3}</Badge>}
                                </div>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-500">{note.nextReviewAtText}</td>
                            <td className="px-5 py-4 font-bold text-slate-500">{note.updatedAtText}</td>
                            <td className="px-5 py-4 text-right">
                                <AppLinkButton href={note.solveHref ?? note.relatedHref} size="sm" iconRight={ChevronRight}>이동</AppLinkButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function TypeDistributionPanel({ items }: { items: NoteItem[] }) {
    const types: NoteType[] = ["wrong-answer", "concept", "template", "review", "idea"];
    const total = Math.max(items.length, 1);

    return (
        <SidePanel title="노트 유형" badge={<BarChart3 className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                {types.map((type) => {
                    const meta = noteTypeMeta[type];
                    const Icon = meta.icon;
                    const count = items.filter((item) => item.type === type).length;
                    const percent = Math.round((count / total) * 100);

                    return (
                        <div key={type}>
                            <div className="mb-2 flex items-center justify-between text-sm font-black">
                                <span className="flex items-center gap-2 text-slate-700"><Icon className="h-4 w-4" />{meta.label}</span>
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

function ReviewQueuePanel({ items }: { items: NoteItem[] }) {
    const queue = [...items]
        .filter((item) => item.status !== "done")
        .sort((a, b) => reviewMeta[a.reviewLevel].order - reviewMeta[b.reviewLevel].order || a.nextReviewAt.localeCompare(b.nextReviewAt))
        .slice(0, 5);

    return (
        <SidePanel title="복습 큐" badge={<RefreshCcw className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                {queue.map((note) => (
                    <Link key={note.id} href={note.solveHref ?? note.relatedHref} className="block rounded-2xl bg-blue-50 px-4 py-3 transition hover:bg-blue-100">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-black text-blue-950">{note.title}</span>
                            <ReviewLevelBadge level={note.reviewLevel} />
                        </div>
                        <p className="line-clamp-2 text-xs font-bold leading-5 text-blue-700">다음 복습 {note.nextReviewAtText} · {note.reviewCount}회 복습</p>
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function PinnedNotesPanel({ items }: { items: NoteItem[] }) {
    const pinned = items.filter((item) => item.pinned).slice(0, 5);

    return (
        <SidePanel title="고정 노트" badge={<Pin className="h-5 w-5 text-orange-500" />}>
            <div className="space-y-2">
                {pinned.map((note) => (
                    <Link key={note.id} href={note.relatedHref} className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50 px-4 py-3 transition hover:bg-orange-100">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-orange-950">{note.title}</p>
                            <p className="mt-0.5 truncate text-xs font-bold text-orange-700">{note.tags.map((tag) => `#${tag}`).join(" ")}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-orange-600" />
                    </Link>
                ))}
            </div>
        </SidePanel>
    );
}

function WeakTagsPanel({ items }: { items: NoteItem[] }) {
    const counts = items.reduce<Record<string, number>>((acc, note) => {
        note.tags.forEach((tag) => {
            acc[tag] = (acc[tag] ?? 0) + 1;
        });
        return acc;
    }, {});

    const topTags = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    return (
        <SidePanel title="자주 등장한 태그" badge={<Hash className="h-5 w-5 text-blue-600" />}>
            <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                    <Link key={tag} href={`/tags/${tag.toLowerCase().replaceAll(" ", "-")}`}>
                        <Badge variant={count >= 3 ? "red" : count === 2 ? "orange" : "default"}>#{tag} {count}</Badge>
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

export default function NotesPage() {
    const [notes, setNotes] = useState<NoteItem[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                const response = await fetch("/api/notes", { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const items = Array.isArray(data.notes) ? data.notes : [];
                if (ignore) return;

                setNotes(items as NoteItem[]);
            } catch (error) {
                console.error("Failed to load /api/notes", error);
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const [keyword, setKeyword] = useState("");
    const [type, setType] = useState<NoteTypeFilter>("전체");
    const [status, setStatus] = useState<NoteStatusFilter>("전체");
    const [reviewLevel, setReviewLevel] = useState<ReviewLevelFilter>("전체");
    const [difficulty, setDifficulty] = useState<DifficultyFilter>("전체");
    const [sort, setSort] = useState<SortOption>("recent");
    const [viewMode, setViewMode] = useState<ViewMode>("card");
    const [message, setMessage] = useState<string | null>(null);

    const filteredNotes = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = notes.filter((note) => {
            const matchesKeyword =
                !lowerKeyword ||
                note.title.toLowerCase().includes(lowerKeyword) ||
                note.summary.toLowerCase().includes(lowerKeyword) ||
                note.cause.toLowerCase().includes(lowerKeyword) ||
                note.fix.toLowerCase().includes(lowerKeyword) ||
                note.learned.toLowerCase().includes(lowerKeyword) ||
                note.problemTitle?.toLowerCase().includes(lowerKeyword) ||
                note.codeSnippet?.toLowerCase().includes(lowerKeyword) ||
                note.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesType = type === "전체" || note.type === typeLabelToValue[type];
            const matchesStatus = status === "전체" || note.status === statusLabelToValue[status];
            const matchesReview = reviewLevel === "전체" || note.reviewLevel === reviewLabelToValue[reviewLevel];
            const matchesDifficulty = difficulty === "전체" || note.problemDifficulty === difficulty;

            return matchesKeyword && matchesType && matchesStatus && matchesReview && matchesDifficulty;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "priority":
                    return reviewMeta[a.reviewLevel].order - reviewMeta[b.reviewLevel].order;
                case "review-date":
                    return a.nextReviewAt.localeCompare(b.nextReviewAt);
                case "title":
                    return a.title.localeCompare(b.title);
                case "problem":
                    return (a.problemId ?? Number.MAX_SAFE_INTEGER) - (b.problemId ?? Number.MAX_SAFE_INTEGER);
                case "created":
                    return b.createdAt.localeCompare(a.createdAt);
                case "recent":
                default:
                    return Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt);
            }
        });
    }, [keyword, type, status, reviewLevel, difficulty, sort]);

    const wrongCount = notes.filter((note) => note.type === "wrong-answer").length;
    const reviewCount = notes.filter((note) => note.status === "reviewing" || note.reviewLevel === "high").length;
    const pinnedCount = notes.filter((note) => note.pinned).length;
    const codeSnippetCount = notes.filter((note) => note.codeSnippet).length;
    const doneCount = notes.filter((note) => note.status === "done").length;
    const doneRate = Math.round((doneCount / Math.max(notes.length, 1)) * 100);

    const resetFilters = () => {
        setKeyword("");
        setType("전체");
        setStatus("전체");
        setReviewLevel("전체");
        setDifficulty("전체");
        setSort("recent");
    };

    const handleCopyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setMessage("코드 스니펫을 클립보드에 복사했습니다.");
        window.setTimeout(() => setMessage(null), 1800);
    };

    return (
        <AppShell title="오답노트" description="오답 원인, 개념, 템플릿, 복습 메모를 관리합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Notes</Badge>
                            <Badge>Wrong Answer Review</Badge>
                            <Badge variant="orange">Review {reviewCount}</Badge>
                        </>
                    }
                    title="틀린 이유를 짧게 남기고 다시 풀어보세요."
                    description="오답 원인, 수정 방법, 배운 점, 코드 스니펫을 기록해 다음 풀이에서 같은 실수를 줄입니다."
                    icon={NotebookPen}
                    rightTitle="전체 노트"
                    rightValue={notes.length.toLocaleString()}
                    rightCaption={`완료율 ${doneRate}% · 고정 ${pinnedCount}개`}
                    metrics={[
                        { label: "오답", value: `${wrongCount}` },
                        { label: "복습", value: `${reviewCount}` },
                        { label: "코드", value: `${codeSnippetCount}` }
                    ]}
                    actions={
                        <>
                            <AppButton variant="primary" size="lg" icon={Plus}>노트 추가</AppButton>
                            <AppLinkButton href="/problems" variant="white" size="lg" icon={BookOpen}>문제 풀기</AppLinkButton>
                        </>
                    }
                />

                {message && <Notice variant="success" title="알림">{message}</Notice>}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 노트" value={notes.length.toLocaleString()} caption="저장된 학습 메모" icon={NotebookPen} tone="blue" />
                    <StatCard label="오답 노트" value={wrongCount.toLocaleString()} caption="문제별 실수 기록" icon={RotateCcw} tone="red" />
                    <StatCard label="복습 필요" value={reviewCount.toLocaleString()} caption="중요도 높음 + 복습 중" icon={RefreshCcw} tone="orange" />
                    <StatCard label="완료율" value={`${doneRate}%`} caption={`${doneCount}/${notes.length} 완료`} icon={CheckCircle2} tone="green" />
                </section>

                <FilterPanel
                    title="노트 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_130px_130px_130px_130px_180px_auto] xl:items-end"
                >
                    <SearchInput value={keyword} onChange={setKeyword} placeholder="제목, 요약, 원인, 수정, 배운 점, 문제명, 코드, 태그 검색" />
                    <FilterSelect label="유형" value={type} onChange={setType} options={TYPE_OPTIONS} />
                    <FilterSelect label="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                    <FilterSelect label="복습" value={reviewLevel} onChange={setReviewLevel} options={REVIEW_OPTIONS} />
                    <FilterSelect label="난이도" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="노트 목록"
                            description={`검색 조건에 맞는 노트 ${filteredNotes.length.toLocaleString()}개가 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredNotes.length === 0 ? (
                            <EmptyState
                                title="노트를 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredNotes.map((note) => <NoteCard key={note.id} note={note} onCopy={handleCopyCode} />)}
                            </div>
                        ) : (
                            <NotesTable items={filteredNotes} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="노트 요약" badge={<Gauge className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">완료율</p>
                                <p className="mt-1 text-5xl font-black">{doneRate}%</p>
                                <ProgressBar value={doneRate} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="전체" value={`${notes.length}`} />
                                <MiniStat label="복습" value={`${reviewCount}`} />
                                <MiniStat label="고정" value={`${pinnedCount}`} />
                            </div>
                        </SidePanel>

                        <ReviewQueuePanel items={notes} />
                        <PinnedNotesPanel items={notes} />
                        <TypeDistributionPanel items={notes} />
                        <WeakTagsPanel items={notes} />

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/problems" label="전체 문제" icon={BookOpen} />
                                <QuickLink href="/submissions" label="제출 기록" icon={ListChecks} />
                                <QuickLink href="/tags/dp" label="DP 복습" icon={Hash} />
                                <QuickLink href="/tests/coding-test-practice-1/result" label="테스트 결과" icon={Trophy} />
                                <QuickLink href="/goals" label="학습 목표" icon={Target} />
                                <QuickLink href="/favorites" label="즐겨찾기" icon={Star} />
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
