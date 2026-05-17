"use client";

import AppShell from "@/components/layout/AppShell";
import {
    AppButton,
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
    ActivityList,
    SubmissionStatusBadge,
    UserCard,
    type SubmissionStatus,
    type UserCardData
} from "@/components/domain";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Code2,
    Flame,
    Gauge,
    Heart,
    History,
    ListChecks,
    Medal,
    NotebookPen,
    PenLine,
    RotateCcw,
    Settings,
    Sparkles,
    Star,
    Target,
    Trophy,
    UserRound,
    UsersRound,
    XCircle,
    Zap
} from "lucide-react";

type ProfileTab = "overview" | "submissions" | "solved" | "activity";
type Difficulty = "Easy" | "Medium" | "Hard";

type ProfileStats = {
    solved: number;
    submissions: number;
    accepted: number;
    wrong: number;
    streakDays: number;
    rank: number;
    score: number;
    accuracy: number;
};

type SolvedProblem = {
    id: number;
    title: string;
    difficulty: Difficulty;
    solvedAt: string;
    tags: string[];
};

type SubmissionItem = {
    id: number;
    problemId: number;
    problemTitle: string;
    status: SubmissionStatus;
    language: string;
    time: string;
    memory: string;
    submittedAt: string;
};

type TagStat = {
    tag: string;
    solved: number;
    total: number;
    href: string;
};

type GoalProgress = {
    title: string;
    current: number;
    target: number;
    unit: string;
    href: string;
};

const currentUser: UserCardData = {
    handle: "kimcode",
    name: "Kim Code",
    bio: "로컬 코딩 테스트 환경에서 알고리즘, 자료구조, DP를 꾸준히 연습하고 있습니다.",
    tier: "Gold",
    rank: 128,
    solved: 342,
    submissions: 891,
    accuracy: 78.4,
    streakDays: 14,
    mainLanguage: "C++17",
    favoriteTags: ["BFS", "DP", "Stack", "Implementation"]
};

const stats: ProfileStats = {
    solved: 342,
    submissions: 891,
    accepted: 699,
    wrong: 151,
    streakDays: 14,
    rank: 128,
    score: 1850,
    accuracy: 78.4
};

const tagStats: TagStat[] = [
    { tag: "구현", solved: 94, total: 286, href: "/tags/implementation" },
    { tag: "BFS", solved: 37, total: 132, href: "/tags/bfs" },
    { tag: "스택", solved: 26, total: 64, href: "/tags/stack" },
    { tag: "DP", solved: 24, total: 174, href: "/tags/dp" },
    { tag: "문자열", solved: 48, total: 112, href: "/tags/string" }
];

const goals: GoalProgress[] = [
    { title: "이번 주 20문제 풀기", current: 13, target: 20, unit: "문제", href: "/goals" },
    { title: "BFS 태그 10문제 정리", current: 4, target: 10, unit: "문제", href: "/tags/bfs" },
    { title: "5월 누적 100문제", current: 18, target: 100, unit: "문제", href: "/goals" }
];

const recentSubmissions: SubmissionItem[] = [
    {
        id: 202605030014,
        problemId: 7576,
        problemTitle: "토마토",
        status: "accepted",
        language: "C++17",
        time: "20ms",
        memory: "4020KB",
        submittedAt: "2026.05.03 12:02"
    },
    {
        id: 202605030004,
        problemId: 12865,
        problemTitle: "평범한 배낭",
        status: "wrong",
        language: "C++17",
        time: "20ms",
        memory: "4256KB",
        submittedAt: "2026.05.03 12:15"
    },
    {
        id: 202605030002,
        problemId: 10828,
        problemTitle: "스택 명령 처리",
        status: "accepted",
        language: "C++17",
        time: "12ms",
        memory: "2144KB",
        submittedAt: "2026.05.03 10:42"
    },
    {
        id: 202605030015,
        problemId: 12865,
        problemTitle: "평범한 배낭",
        status: "compile",
        language: "JavaScript",
        time: "-",
        memory: "-",
        submittedAt: "2026.05.03 12:22"
    }
];

const solvedProblems: SolvedProblem[] = [
    { id: 1000, title: "두 수의 합", difficulty: "Easy", solvedAt: "2026.05.03", tags: ["구현", "수학"] },
    { id: 10828, title: "스택 명령 처리", difficulty: "Medium", solvedAt: "2026.05.03", tags: ["스택", "자료구조"] },
    { id: 7576, title: "토마토", difficulty: "Medium", solvedAt: "2026.05.03", tags: ["BFS", "그래프"] },
    { id: 11053, title: "가장 긴 증가하는 부분 수열", difficulty: "Medium", solvedAt: "2026.05.02", tags: ["DP", "LIS"] }
];

const activityItems = [
    {
        title: "토마토 문제를 해결했습니다.",
        description: "다중 시작점 BFS에서 초기 큐 설정을 수정했습니다.",
        time: "오늘 12:02",
        icon: CheckCircle2,
        href: "/problems/7576"
    },
    {
        title: "평범한 배낭 문제에서 오답이 발생했습니다.",
        description: "1차원 DP 갱신 방향을 다시 확인해야 합니다.",
        time: "오늘 12:15",
        icon: XCircle,
        href: "/problems/12865"
    },
    {
        title: "이번 주 목표 진행률이 65%가 되었습니다.",
        description: "20문제 중 13문제를 완료했습니다.",
        time: "오늘 11:40",
        icon: Target,
        href: "/goals"
    },
    {
        title: "14일 연속 학습 기록을 달성했습니다.",
        description: "연속 학습 루틴이 유지되고 있습니다.",
        time: "오늘 09:00",
        icon: Flame,
        href: "/dashboard"
    }
];

const tabLabels: Record<ProfileTab, string> = {
    overview: "개요",
    submissions: "제출",
    solved: "해결 문제",
    activity: "활동"
};

const difficultyVariant = {
    Easy: "green",
    Medium: "orange",
    Hard: "red"
} as const;

function TabButton({ tab, activeTab, onClick }: { tab: ProfileTab; activeTab: ProfileTab; onClick: (tab: ProfileTab) => void }) {
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

function ProfileSummaryCard() {
    return (
        <Card className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-slate-950 text-white shadow-sm">
                    <UserRound className="h-12 w-12" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="amber">Gold</Badge>
                        <Badge variant="blue">Rank #{currentUser.rank}</Badge>
                        <Badge variant="orange"><Flame className="mr-1 h-3.5 w-3.5" />{currentUser.streakDays}일 연속</Badge>
                    </div>

                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{currentUser.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-400">@{currentUser.handle}</p>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">{currentUser.bio}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {currentUser.favoriteTags?.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                    <AppLinkButton href={`/profile/${currentUser.handle}`} variant="primary" iconRight={ArrowRight}>
                        공개 프로필
                    </AppLinkButton>
                    <AppLinkButton href="/settings" variant="secondary" icon={Settings}>
                        설정
                    </AppLinkButton>
                </div>
            </div>
        </Card>
    );
}

function OverviewTab() {
    return (
        <div className="space-y-4">
            <ProfileSummaryCard />

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-black text-slate-950">난이도별 해결</h3>
                        <Trophy className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="space-y-4">
                        <DifficultyProgress label="Easy" value={168} total={220} />
                        <DifficultyProgress label="Medium" value={142} total={260} />
                        <DifficultyProgress label="Hard" value={32} total={140} />
                    </div>
                </Card>

                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-black text-slate-950">태그별 강점</h3>
                        <Star className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="space-y-3">
                        {tagStats.slice(0, 4).map((tag) => <TagProgress key={tag.tag} item={tag} />)}
                    </div>
                </Card>
            </div>

            <Card className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-black text-slate-950">학습 목표</h3>
                    <AppLinkButton href="/goals" size="sm" iconRight={ChevronRight}>전체 보기</AppLinkButton>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                    {goals.map((goal) => <GoalMiniCard key={goal.title} goal={goal} />)}
                </div>
            </Card>
        </div>
    );
}

function DifficultyProgress({ label, value, total }: { label: Difficulty; value: number; total: number }) {
    const percent = Math.round((value / Math.max(total, 1)) * 100);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <Badge variant={difficultyVariant[label]}>{label}</Badge>
                <span className="text-slate-500">{value} / {total}</span>
            </div>
            <ProgressBar value={percent} barClassName={label === "Easy" ? "bg-emerald-600" : label === "Medium" ? "bg-orange-500" : "bg-rose-600"} />
        </div>
    );
}

function TagProgress({ item }: { item: TagStat }) {
    const percent = Math.round((item.solved / Math.max(item.total, 1)) * 100);

    return (
        <Link href={item.href} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="text-slate-800">#{item.tag}</span>
                <span className="text-slate-500">{item.solved} / {item.total}</span>
            </div>
            <ProgressBar value={percent} />
        </Link>
    );
}

function GoalMiniCard({ goal }: { goal: GoalProgress }) {
    const percent = Math.round((goal.current / Math.max(goal.target, 1)) * 100);

    return (
        <Link href={goal.href} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-3">
                <h4 className="font-black leading-6 text-slate-950">{goal.title}</h4>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="text-slate-500">{goal.current} / {goal.target} {goal.unit}</span>
                <span className="text-blue-600">{percent}%</span>
            </div>
            <ProgressBar value={percent} />
        </Link>
    );
}

function SubmissionsTab() {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">제출</th>
                        <th className="px-5 py-4">문제</th>
                        <th className="px-5 py-4">결과</th>
                        <th className="px-5 py-4">언어</th>
                        <th className="px-5 py-4">시간</th>
                        <th className="px-5 py-4">메모리</th>
                        <th className="px-5 py-4">제출 시간</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {recentSubmissions.map((submission) => (
                        <tr key={submission.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4 font-black text-slate-700">#{submission.id}</td>
                            <td className="px-5 py-4">
                                <Link href={`/problems/${submission.problemId}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                    {submission.problemTitle}
                                </Link>
                                <p className="mt-1 text-xs font-bold text-slate-400">#{submission.problemId}</p>
                            </td>
                            <td className="px-5 py-4"><SubmissionStatusBadge value={submission.status} /></td>
                            <td className="px-5 py-4"><Badge variant="blue">{submission.language}</Badge></td>
                            <td className="px-5 py-4 font-bold text-slate-600">{submission.time}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">{submission.memory}</td>
                            <td className="px-5 py-4 font-bold text-slate-500">{submission.submittedAt}</td>
                            <td className="px-5 py-4 text-right">
                                <AppLinkButton href={`/submissions/${submission.id}`} size="sm" iconRight={ChevronRight}>상세</AppLinkButton>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function SolvedTab() {
    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {solvedProblems.map((problem) => (
                <Card key={problem.id} hover className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant={difficultyVariant[problem.difficulty]}>{problem.difficulty}</Badge>
                        <Badge variant="green">해결</Badge>
                        <Badge>{problem.solvedAt}</Badge>
                    </div>
                    <Link href={`/problems/${problem.id}`} className="text-xl font-black text-slate-950 transition hover:text-blue-600">
                        {problem.id}. {problem.title}
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {problem.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                    <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                        <AppLinkButton href={`/problems/${problem.id}/solve`} variant="primary" iconRight={ArrowRight}>다시 풀기</AppLinkButton>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function ActivityTab() {
    return (
        <Card className="p-5">
            <ActivityList items={activityItems} />
        </Card>
    );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof BookOpen }) {
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

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

    const acceptedRate = useMemo(() => Math.round((stats.accepted / Math.max(stats.submissions, 1)) * 1000) / 10, []);
    const weeklyGoalPercent = Math.round((13 / 20) * 100);

    return (
        <AppShell title="내 프로필" description="풀이 기록, 학습 목표, 활동 내역을 확인합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Profile</Badge>
                            <Badge variant="amber">Gold</Badge>
                            <Badge variant="orange"><Flame className="mr-1 h-3.5 w-3.5" />14일 연속</Badge>
                        </>
                    }
                    title="내 풀이 기록과 학습 흐름을 확인하세요."
                    description="해결한 문제, 최근 제출, 목표 달성률, 강점 태그를 한 화면에서 확인하고 다음 학습으로 이어갈 수 있습니다."
                    icon={UserRound}
                    rightTitle="현재 점수"
                    rightValue={stats.score.toLocaleString()}
                    rightCaption={`전체 랭킹 #${stats.rank}`}
                    metrics={[
                        { label: "해결", value: `${stats.solved}` },
                        { label: "정답률", value: `${stats.accuracy}%` },
                        { label: "연속", value: `${stats.streakDays}일` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href={`/profile/${currentUser.handle}`} variant="primary" size="lg" iconRight={ArrowRight}>공개 프로필 보기</AppLinkButton>
                            <AppLinkButton href="/settings" variant="white" size="lg" icon={Settings}>프로필 설정</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="해결 문제" value={stats.solved.toLocaleString()} caption="누적 해결 수" icon={CheckCircle2} tone="green" />
                    <StatCard label="제출" value={stats.submissions.toLocaleString()} caption={`AC ${stats.accepted} / WA ${stats.wrong}`} icon={ListChecks} tone="blue" />
                    <StatCard label="정답률" value={`${acceptedRate}%`} caption="제출 기준 통과율" icon={Gauge} tone="orange" />
                    <StatCard label="연속 학습" value={`${stats.streakDays}일`} caption="현재 스트릭" icon={Flame} tone="red" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(["overview", "submissions", "solved", "activity"] as ProfileTab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
                                ))}
                            </div>
                        </Card>

                        {activeTab === "overview" && <OverviewTab />}
                        {activeTab === "submissions" && <SubmissionsTab />}
                        {activeTab === "solved" && <SolvedTab />}
                        {activeTab === "activity" && <ActivityTab />}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="사용자 카드" badge={<UserRound className="h-5 w-5 text-blue-600" />}>
                            <UserCard user={currentUser} />
                        </SidePanel>

                        <SidePanel title="이번 주 목표" badge={<Target className="h-5 w-5 text-blue-600" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">20문제 풀기</p>
                                <p className="mt-1 text-5xl font-black">{weeklyGoalPercent}%</p>
                                <ProgressBar value={weeklyGoalPercent} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="완료" value="13" />
                                <MiniStat label="목표" value="20" />
                                <MiniStat label="남음" value="7" />
                            </div>
                        </SidePanel>

                        <SidePanel title="강점 태그" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                {tagStats.map((tag) => (
                                    <Link key={tag.tag} href={tag.href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                                        #{tag.tag}
                                        <span className="text-slate-400">{tag.solved}/{tag.total}</span>
                                    </Link>
                                ))}
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/dashboard" label="대시보드" icon={BarChart3} />
                                <QuickLink href="/goals" label="학습 목표" icon={Target} />
                                <QuickLink href="/notes" label="오답노트" icon={NotebookPen} />
                                <QuickLink href="/favorites" label="즐겨찾기" icon={Heart} />
                                <QuickLink href="/ranking" label="랭킹" icon={Medal} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/profile`은 DB 사용자 데이터 기반입니다. API는 로그인 사용자 정보, 제출 기록, 목표, 오답노트, 랭킹 데이터를 API로 받아오면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
