"use client";

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
    UserCard
} from "@/components/domain";
import type { UserCardData } from "@/components/domain";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Crown,
    Flame,
    Gauge,
    Medal,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    Trophy,
    UserRound,
    UsersRound,
    Zap
} from "lucide-react";

type Tier = UserCardData["tier"];
type TierFilter = "전체" | Tier;
type LanguageFilter = "전체" | "C++17" | "Python 3.12" | "Java 17" | "JavaScript";
type SortOption = "rank" | "score" | "solved" | "accuracy" | "streak" | "submissions";

type RankingUser = Omit<UserCardData, "streakDays"> & {
    streakDays: number;
    score: number;
    country: string;
    joinedAt: string;
    weeklySolved: number;
    monthlySolved: number;
    lastActiveAt: string;
    isCurrentUser?: boolean;
};

const rankingUsers: RankingUser[] = [
    {
        handle: "algo_master",
        name: "Algorithm Master",
        bio: "그래프와 최단 경로 문제를 좋아하는 알고리즘 러너입니다.",
        tier: "Diamond",
        rank: 1,
        score: 9850,
        solved: 1240,
        submissions: 2388,
        accuracy: 82.6,
        streakDays: 61,
        mainLanguage: "C++17",
        favoriteTags: ["Graph", "Dijkstra", "DP", "Segment Tree"],
        country: "KR",
        joinedAt: "2025.09.01",
        weeklySolved: 42,
        monthlySolved: 172,
        lastActiveAt: "2026.05.03 12:51"
    },
    {
        handle: "code_wizard",
        name: "Code Wizard",
        bio: "DP와 수학 문제를 꾸준히 풀고 있습니다.",
        tier: "Diamond",
        rank: 2,
        score: 9320,
        solved: 1184,
        submissions: 2210,
        accuracy: 80.1,
        streakDays: 48,
        mainLanguage: "C++17",
        favoriteTags: ["DP", "Math", "Greedy"],
        country: "KR",
        joinedAt: "2025.10.11",
        weeklySolved: 36,
        monthlySolved: 148,
        lastActiveAt: "2026.05.03 11:48"
    },
    {
        handle: "solve_it",
        name: "Solve It",
        bio: "자료구조와 구현 문제를 빠르게 푸는 연습을 하고 있습니다.",
        tier: "Platinum",
        rank: 3,
        score: 8820,
        solved: 1042,
        submissions: 2054,
        accuracy: 76.8,
        streakDays: 37,
        mainLanguage: "Python 3.12",
        favoriteTags: ["Implementation", "String", "Stack"],
        country: "KR",
        joinedAt: "2025.11.03",
        weeklySolved: 31,
        monthlySolved: 132,
        lastActiveAt: "2026.05.03 10:22"
    },
    {
        handle: "dev_runner",
        name: "Dev Runner",
        bio: "매일 한 문제 이상 푸는 것을 목표로 하고 있습니다.",
        tier: "Platinum",
        rank: 4,
        score: 8210,
        solved: 956,
        submissions: 1820,
        accuracy: 78.9,
        streakDays: 92,
        mainLanguage: "Java 17",
        favoriteTags: ["BFS", "DFS", "Simulation"],
        country: "KR",
        joinedAt: "2025.12.21",
        weeklySolved: 28,
        monthlySolved: 118,
        lastActiveAt: "2026.05.03 09:36"
    },
    {
        handle: "kimcode",
        name: "Kim Code",
        bio: "로컬 코딩 테스트 환경에서 알고리즘, 자료구조, DP를 꾸준히 연습하고 있습니다.",
        tier: "Gold",
        rank: 128,
        score: 1850,
        solved: 342,
        submissions: 891,
        accuracy: 78.4,
        streakDays: 14,
        mainLanguage: "C++17",
        favoriteTags: ["BFS", "DP", "Stack", "Implementation"],
        country: "KR",
        joinedAt: "2026.01.12",
        weeklySolved: 13,
        monthlySolved: 18,
        lastActiveAt: "2026.05.03 13:42",
        isCurrentUser: true
    },
    {
        handle: "pythonista",
        name: "Pythonista",
        bio: "Python으로 문자열과 탐색 문제를 연습합니다.",
        tier: "Gold",
        rank: 142,
        score: 1720,
        solved: 318,
        submissions: 702,
        accuracy: 74.2,
        streakDays: 9,
        mainLanguage: "Python 3.12",
        favoriteTags: ["String", "BFS", "Set"],
        country: "KR",
        joinedAt: "2026.02.02",
        weeklySolved: 9,
        monthlySolved: 24,
        lastActiveAt: "2026.05.02 22:10"
    },
    {
        handle: "java_sprinter",
        name: "Java Sprinter",
        bio: "Java 기반 코딩테스트 풀이 속도를 높이고 있습니다.",
        tier: "Silver",
        rank: 286,
        score: 980,
        solved: 174,
        submissions: 442,
        accuracy: 68.6,
        streakDays: 6,
        mainLanguage: "Java 17",
        favoriteTags: ["Queue", "Implementation", "Sort"],
        country: "KR",
        joinedAt: "2026.02.18",
        weeklySolved: 7,
        monthlySolved: 16,
        lastActiveAt: "2026.05.01 19:28"
    },
    {
        handle: "js_solver",
        name: "JS Solver",
        bio: "JavaScript로 문제 풀이를 실험하고 있습니다.",
        tier: "Bronze",
        rank: 512,
        score: 420,
        solved: 82,
        submissions: 210,
        accuracy: 61.1,
        streakDays: 3,
        mainLanguage: "JavaScript",
        favoriteTags: ["Array", "String", "Math"],
        country: "KR",
        joinedAt: "2026.03.12",
        weeklySolved: 4,
        monthlySolved: 9,
        lastActiveAt: "2026.04.30 20:02"
    }
];

const DEFAULT_rankingUsers = rankingUsers;

const TIER_OPTIONS: readonly TierFilter[] = ["전체", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
const LANGUAGE_OPTIONS: readonly LanguageFilter[] = ["전체", "C++17", "Python 3.12", "Java 17", "JavaScript"];
const SORT_OPTIONS: readonly SortOption[] = ["rank", "score", "solved", "accuracy", "streak", "submissions"];

const sortLabels: Record<SortOption, string> = {
    rank: "랭킹순",
    score: "점수 높은순",
    solved: "해결 문제 많은순",
    accuracy: "정답률 높은순",
    streak: "연속 학습 긴순",
    submissions: "제출 많은순"
};

const tierVariant = {
    Bronze: "amber",
    Silver: "default",
    Gold: "amber",
    Platinum: "cyan",
    Diamond: "blue"
} as const;

function getTierCount(tier: Tier) {
    return rankingUsers.filter((user) => user.tier === tier).length;
}

function getCurrentUser() {
    return rankingUsers.find((user) => user.isCurrentUser) ?? rankingUsers[0] ?? null;
}

function getRankIcon(rank: number) {
    if (rank === 1) return Crown;
    if (rank <= 3) return Medal;
    return Trophy;
}

function TopRankerCard({ user }: { user: RankingUser }) {
    const RankIcon = getRankIcon(user.rank);

    return (
        <Link href={`/profile/${user.handle}`} className="block rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-white ${user.rank === 1 ? "bg-amber-500" : user.rank === 2 ? "bg-slate-500" : "bg-orange-500"}`}>
                        <RankIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                            <Badge variant="blue">#{user.rank}</Badge>
                            <Badge variant={tierVariant[user.tier]}>{user.tier}</Badge>
                        </div>
                        <h3 className="text-xl font-black text-slate-950">{user.name}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-400">@{user.handle}</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-7 text-slate-500">{user.bio}</p>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniStat label="점수" value={user.score.toLocaleString()} />
                <MiniStat label="해결" value={user.solved.toLocaleString()} />
                <MiniStat label="정답률" value={`${user.accuracy}%`} />
            </div>
        </Link>
    );
}

function RankingTable({ users }: { users: RankingUser[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">순위</th>
                        <th className="px-5 py-4">사용자</th>
                        <th className="px-5 py-4">티어</th>
                        <th className="px-5 py-4 text-right">점수</th>
                        <th className="px-5 py-4 text-right">해결</th>
                        <th className="px-5 py-4 text-right">제출</th>
                        <th className="px-5 py-4 text-right">정답률</th>
                        <th className="px-5 py-4 text-right">연속</th>
                        <th className="px-5 py-4">주 언어</th>
                        <th className="px-5 py-4" />
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {users.map((user) => {
                        const RankIcon = getRankIcon(user.rank);

                        return (
                            <tr key={user.handle} className={`transition hover:bg-slate-50 ${user.isCurrentUser ? "bg-blue-50/50" : ""}`}>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2 font-black text-slate-950">
                                        <RankIcon className={`h-4 w-4 ${user.rank === 1 ? "text-amber-500" : user.rank <= 3 ? "text-slate-500" : "text-slate-300"}`} />
                                        #{user.rank}
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <Link href={`/profile/${user.handle}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                        {user.name}
                                    </Link>
                                    <p className="mt-1 text-xs font-bold text-slate-400">@{user.handle}</p>
                                </td>
                                <td className="px-5 py-4"><Badge variant={tierVariant[user.tier]}>{user.tier}</Badge></td>
                                <td className="px-5 py-4 text-right font-black text-slate-950">{user.score.toLocaleString()}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{user.solved.toLocaleString()}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{user.submissions.toLocaleString()}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{user.accuracy}%</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-600">{user.streakDays}일</td>
                                <td className="px-5 py-4"><Badge variant="blue">{user.mainLanguage}</Badge></td>
                                <td className="px-5 py-4 text-right">
                                    <AppLinkButton href={`/profile/${user.handle}`} size="sm" iconRight={ChevronRight}>프로필</AppLinkButton>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function RankCard({ user }: { user: RankingUser }) {
    return (
        <Card hover className={`p-5 ${user.isCurrentUser ? "border-blue-200 bg-blue-50/40" : ""}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="blue">#{user.rank}</Badge>
                        <Badge variant={tierVariant[user.tier]}>{user.tier}</Badge>
                        <Badge variant="orange"><Flame className="mr-1 h-3.5 w-3.5" />{user.streakDays}일</Badge>
                        {user.isCurrentUser && <Badge variant="green">나</Badge>}
                    </div>

                    <Link href={`/profile/${user.handle}`} className="text-xl font-black text-slate-950 transition hover:text-blue-600">
                        {user.name}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-slate-400">@{user.handle}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{user.bio}</p>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
                    <MetricBox label="점수" value={user.score.toLocaleString()} />
                    <MetricBox label="해결" value={user.solved.toLocaleString()} />
                    <MetricBox label="정답률" value={`${user.accuracy}%`} />
                    <MetricBox label="이번 달" value={`${user.monthlySolved}문제`} />
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {user.favoriteTags?.slice(0, 4).map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">최근 활동 {user.lastActiveAt}</div>
                <div className="flex flex-wrap gap-2">
                    <AppLinkButton href={`/profile/${user.handle}`} variant="primary" iconRight={ArrowRight}>프로필 보기</AppLinkButton>
                </div>
            </div>
        </Card>
    );
}

function MetricBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 font-black text-slate-950">{value}</p>
        </div>
    );
}

function TierDistributionPanel() {
    const total = rankingUsers.length;

    return (
        <SidePanel title="티어 분포" badge={<ShieldCheck className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-4">
                {(["Diamond", "Platinum", "Gold", "Silver", "Bronze"] as Tier[]).map((tier) => {
                    const count = getTierCount(tier);
                    const percent = Math.round((count / Math.max(total, 1)) * 100);

                    return (
                        <div key={tier}>
                            <div className="mb-2 flex items-center justify-between text-sm font-black">
                                <Badge variant={tierVariant[tier]}>{tier}</Badge>
                                <span className="text-slate-500">{count}명</span>
                            </div>
                            <ProgressBar value={percent} />
                        </div>
                    );
                })}
            </div>
        </SidePanel>
    );
}

function MyRankPanel({ user }: { user: RankingUser }) {
    const nextRanker = rankingUsers.find((item) => item.rank === user.rank - 1);
    const gap = nextRanker ? nextRanker.score - user.score : 0;

    return (
        <SidePanel title="내 순위" badge={<UserRound className="h-5 w-5 text-blue-600" />}>
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-sm font-black text-slate-300">현재 랭킹</p>
                <p className="mt-1 text-5xl font-black">#{user.rank}</p>
                <p className="mt-2 text-sm font-bold text-slate-300">{user.score.toLocaleString()}점</p>
                <ProgressBar value={Math.max(3, 100 - user.rank / 2)} className="mt-5 bg-white/10" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat label="해결" value={user.solved.toLocaleString()} />
                <MiniStat label="정답률" value={`${user.accuracy}%`} />
                <MiniStat label="연속" value={`${user.streakDays}일`} />
            </div>
            <Notice variant="info" title="다음 목표" className="mt-4">
                {nextRanker ? `한 단계 상승까지 약 ${gap.toLocaleString()}점이 필요합니다.` : "현재 최고 순위입니다."}
            </Notice>
        </SidePanel>
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

export default function RankingPage() {
    const [rankingUsers, setRankingUsers] = useState<RankingUser[]>([]);

    useEffect(() => {
        let ignore = false;

        async function loadDbData() {
            try {
                const response = await fetch("/api/ranking", { cache: "no-store" });
                if (!response.ok) return;

                const data = await response.json();
                const items = Array.isArray(data.rankings) ? data.rankings : [];
                if (ignore) return;

                setRankingUsers(items as RankingUser[]);
            } catch (error) {
                console.error("Failed to load /api/ranking", error);
            }
        }

        void loadDbData();

        return () => {
            ignore = true;
        };
    }, []);

    const [keyword, setKeyword] = useState("");
    const [tier, setTier] = useState<TierFilter>("전체");
    const [language, setLanguage] = useState<LanguageFilter>("전체");
    const [sort, setSort] = useState<SortOption>("rank");
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const filteredUsers = useMemo(() => {
        const lowerKeyword = keyword.trim().toLowerCase();

        const result = rankingUsers.filter((user) => {
            const matchesKeyword =
                !lowerKeyword ||
                user.name.toLowerCase().includes(lowerKeyword) ||
                user.handle.toLowerCase().includes(lowerKeyword) ||
                user.bio?.toLowerCase().includes(lowerKeyword) ||
                user.favoriteTags?.some((tag) => tag.toLowerCase().includes(lowerKeyword));

            const matchesTier = tier === "전체" || user.tier === tier;
            const matchesLanguage = language === "전체" || user.mainLanguage === language;

            return matchesKeyword && matchesTier && matchesLanguage;
        });

        return result.sort((a, b) => {
            switch (sort) {
                case "score":
                    return b.score - a.score;
                case "solved":
                    return b.solved - a.solved;
                case "accuracy":
                    return b.accuracy - a.accuracy;
                case "streak":
                    return b.streakDays! - a.streakDays!;
                case "submissions":
                    return b.submissions - a.submissions;
                case "rank":
                default:
                    return a.rank - b.rank;
            }
        });
    }, [keyword, tier, language, sort]);

    const topUsers = rankingUsers.slice(0, 3);
    const currentUser = getCurrentUser();
    const totalSolved = rankingUsers.reduce((sum, user) => sum + user.solved, 0);
    const averageAccuracy = Math.round((rankingUsers.reduce((sum, user) => sum + user.accuracy, 0) / rankingUsers.length) * 10) / 10;
    const maxStreak = Math.max(...rankingUsers.map((user) => user.streakDays));

    const resetFilters = () => {
        setKeyword("");
        setTier("전체");
        setLanguage("전체");
        setSort("rank");
    };

    return (
        <AppShell title="랭킹" description="사용자별 풀이 점수, 해결 수, 정답률을 비교합니다.">
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Badge variant="blue">Ranking</Badge>
                            <Badge>Local Judge</Badge>
                            <Badge variant="amber">Top {rankingUsers.length}</Badge>
                        </>
                    }
                    title="코딩 테스트 랭킹을 확인하세요."
                    description="해결한 문제 수, 점수, 정답률, 연속 학습일을 기준으로 사용자 순위를 비교할 수 있습니다."
                    icon={Medal}
                    rightTitle="현재 1위"
                    rightValue={topUsers[0] ? `#${topUsers[0].rank}` : "-"}
                    rightCaption={topUsers[0] ? `${topUsers[0].name} · ${topUsers[0].score.toLocaleString()}점` : "DB 사용자 없음"}
                    metrics={[
                        { label: "사용자", value: `${rankingUsers.length}` },
                        { label: "전체 해결", value: `${totalSolved}` },
                        { label: "평균 정답률", value: `${averageAccuracy}%` }
                    ]}
                    actions={
                        <>
                            {currentUser ? <AppLinkButton href={`/profile/${currentUser.handle}`} variant="primary" size="lg" iconRight={ArrowRight}>내 순위 보기</AppLinkButton> : null}
                            <AppLinkButton href="/problems" variant="white" size="lg" icon={BookOpen}>문제 풀기</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="전체 사용자" value={rankingUsers.length.toLocaleString()} caption="랭킹 집계 대상" icon={UsersRound} />
                    <StatCard label="전체 해결" value={totalSolved.toLocaleString()} caption="누적 해결 문제" icon={CheckCircle2} tone="green" />
                    <StatCard label="평균 정답률" value={`${averageAccuracy}%`} caption="제출 기준 평균" icon={Gauge} tone="orange" />
                    <StatCard label="최장 스트릭" value={`${maxStreak}일`} caption="연속 학습 기록" icon={Flame} tone="red" />
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-slate-950">상위 랭커</h3>
                            <p className="mt-1 text-sm text-slate-500">현재 점수 기준 TOP 3 사용자입니다.</p>
                        </div>
                        <Trophy className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                        {topUsers.length === 0 ? (
                            <EmptyState title="랭킹 사용자가 없습니다." description="DB에 사용자를 추가하거나 seed를 실행하세요." icon={Search} />
                        ) : topUsers.map((user) => <TopRankerCard key={user.handle} user={user} />)}
                    </div>
                </section>

                <FilterPanel
                    title="랭킹 검색 / 필터"
                    onReset={resetFilters}
                    gridClassName="grid gap-3 xl:grid-cols-[1.4fr_160px_180px_190px_auto] xl:items-end"
                >
                    <SearchInput
                        value={keyword}
                        onChange={setKeyword}
                        placeholder="이름, 핸들, 태그, 소개 검색"
                    />
                    <FilterSelect label="티어" value={tier} onChange={setTier} options={TIER_OPTIONS} />
                    <FilterSelect label="주 언어" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
                    <FilterSelect label="정렬" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                </FilterPanel>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-4">
                        <ListHeader
                            title="전체 랭킹"
                            description={`검색 조건에 맞는 사용자 ${filteredUsers.length.toLocaleString()}명이 표시됩니다. 현재 정렬: ${sortLabels[sort]}`}
                            right={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
                        />

                        {filteredUsers.length === 0 ? (
                            <EmptyState
                                title="사용자를 찾을 수 없습니다."
                                description="검색어 또는 필터 조건을 변경해보세요."
                                icon={Search}
                                onReset={resetFilters}
                            />
                        ) : viewMode === "card" ? (
                            <div className="space-y-4">
                                {filteredUsers.map((user) => <RankCard key={user.handle} user={user} />)}
                            </div>
                        ) : (
                            <RankingTable users={filteredUsers} />
                        )}
                    </div>

                    <aside className="space-y-4">
                        {currentUser ? <MyRankPanel user={currentUser} /> : null}

                        {currentUser ? (
                            <SidePanel title="내 사용자 카드" badge={<UserRound className="h-5 w-5 text-blue-600" />}>
                                <UserCard user={currentUser} />
                            </SidePanel>
                        ) : null}

                        <TierDistributionPanel />

                        <SidePanel title="추천 행동" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/goals" label="이번 주 목표 확인" icon={Target} />
                                <QuickLink href="/notes" label="오답노트 복습" icon={Star} />
                                <QuickLink href="/tests" label="모의 테스트 응시" icon={Zap} />
                                <QuickLink href="/problems" label="새 문제 풀기" icon={BookOpen} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/ranking`은 DB 사용자 데이터 기반입니다. API는 `GET /api/ranking`, `GET /api/ranking/me`, `GET /api/users/:handle`을 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
