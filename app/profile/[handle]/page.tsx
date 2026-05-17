"use client";

import {ActivityList, SubmissionStatus, SubmissionStatusBadge, UserCard, UserCardData } from "@/components/domain";
import AppShell from "@/components/layout/AppShell";
import {
    ArrowLeft,
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
    Globe2,
    History,
    ListChecks,
    Mail,
    Medal,
    Search,
    Sparkles,
    Star,
    Trophy,
    UserRound,
    UsersRound,
    Zap
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
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
import { ComponentType, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type PublicProfileTab = "overview" | "submissions" | "solved" | "activity";
type Difficulty = "Easy" | "Medium" | "Hard";

type PublicUser = UserCardData & {
    joinedAt: string;
    location: string;
    website?: string;
    github?: string;
    email?: string;
    isFollowing: boolean;
    followers: number;
    following: number;
    lastActiveAt: string;
};

type PublicStats = {
    solved: number;
    submissions: number;
    accepted: number;
    wrong: number;
    streakDays: number;
    rank: number;
    score: number;
    accuracy: number;
    contests: number;
    notes: number;
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

type MonthlyPoint = {
    month: string;
    solved: number;
};

type ProfileBundle = {
    user: PublicUser;
    stats: PublicStats;
    tagStats: TagStat[];
    monthly: MonthlyPoint[];
    submissions: SubmissionItem[];
    solvedProblems: SolvedProblem[];
};

const profiles: ProfileBundle[] = [
    {
        user: {
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
            favoriteTags: ["BFS", "DP", "Stack", "Implementation"],
            joinedAt: "2026.01.12",
            location: "Seoul, KR",
            website: "https://example.dev",
            github: "kimcode",
            email: "kimcode@example.com",
            isFollowing: false,
            followers: 128,
            following: 42,
            lastActiveAt: "2026.05.03 13:42"
        },
        stats: {
            solved: 342,
            submissions: 891,
            accepted: 699,
            wrong: 151,
            streakDays: 14,
            rank: 128,
            score: 1850,
            accuracy: 78.4,
            contests: 12,
            notes: 37
        },
        tagStats: [
            { tag: "구현", solved: 94, total: 286, href: "/tags/implementation" },
            { tag: "BFS", solved: 37, total: 132, href: "/tags/bfs" },
            { tag: "스택", solved: 26, total: 64, href: "/tags/stack" },
            { tag: "DP", solved: 24, total: 174, href: "/tags/dp" },
            { tag: "문자열", solved: 48, total: 112, href: "/tags/string" }
        ],
        monthly: [
            { month: "1월", solved: 32 },
            { month: "2월", solved: 48 },
            { month: "3월", solved: 56 },
            { month: "4월", solved: 72 },
            { month: "5월", solved: 18 }
        ],
        submissions: [
            { id: 202605030014, problemId: 7576, problemTitle: "토마토", status: "accepted", language: "C++17", time: "20ms", memory: "4020KB", submittedAt: "2026.05.03 12:02" },
            { id: 202605030004, problemId: 12865, problemTitle: "평범한 배낭", status: "wrong", language: "C++17", time: "20ms", memory: "4256KB", submittedAt: "2026.05.03 12:15" },
            { id: 202605030002, problemId: 10828, problemTitle: "스택 명령 처리", status: "accepted", language: "C++17", time: "12ms", memory: "2144KB", submittedAt: "2026.05.03 10:42" },
            { id: 202605030015, problemId: 12865, problemTitle: "평범한 배낭", status: "compile", language: "JavaScript", time: "-", memory: "-", submittedAt: "2026.05.03 12:22" }
        ],
        solvedProblems: [
            { id: 1000, title: "두 수의 합", difficulty: "Easy", solvedAt: "2026.05.03", tags: ["구현", "수학"] },
            { id: 10828, title: "스택 명령 처리", difficulty: "Medium", solvedAt: "2026.05.03", tags: ["스택", "자료구조"] },
            { id: 7576, title: "토마토", difficulty: "Medium", solvedAt: "2026.05.03", tags: ["BFS", "그래프"] },
            { id: 11053, title: "가장 긴 증가하는 부분 수열", difficulty: "Medium", solvedAt: "2026.05.02", tags: ["DP", "LIS"] }
        ]
    },
    {
        user: {
            handle: "algo_master",
            name: "Algorithm Master",
            bio: "그래프와 최단 경로 문제를 좋아하는 알고리즘 러너입니다.",
            tier: "Diamond",
            rank: 1,
            solved: 1240,
            submissions: 2388,
            accuracy: 82.6,
            streakDays: 61,
            mainLanguage: "C++17",
            favoriteTags: ["Dijkstra", "Graph", "DP", "Segment Tree"],
            joinedAt: "2025.09.01",
            location: "Busan, KR",
            github: "algo-master",
            isFollowing: true,
            followers: 2481,
            following: 112,
            lastActiveAt: "2026.05.03 12:51"
        },
        stats: {
            solved: 1240,
            submissions: 2388,
            accepted: 1972,
            wrong: 271,
            streakDays: 61,
            rank: 1,
            score: 9850,
            accuracy: 82.6,
            contests: 48,
            notes: 122
        },
        tagStats: [
            { tag: "그래프", solved: 212, total: 260, href: "/tags/graph" },
            { tag: "DP", solved: 174, total: 174, href: "/tags/dp" },
            { tag: "다익스트라", solved: 74, total: 74, href: "/tags/dijkstra" },
            { tag: "세그먼트 트리", solved: 68, total: 90, href: "/tags/segment-tree" },
            { tag: "수학", solved: 146, total: 146, href: "/tags/math" }
        ],
        monthly: [
            { month: "1월", solved: 122 },
            { month: "2월", solved: 148 },
            { month: "3월", solved: 156 },
            { month: "4월", solved: 172 },
            { month: "5월", solved: 42 }
        ],
        submissions: [
            { id: 202605030101, problemId: 1753, problemTitle: "최단경로", status: "accepted", language: "C++17", time: "44ms", memory: "8120KB", submittedAt: "2026.05.03 12:51" },
            { id: 202605030099, problemId: 1916, problemTitle: "최소비용 구하기", status: "accepted", language: "C++17", time: "32ms", memory: "7020KB", submittedAt: "2026.05.03 12:21" },
            { id: 202605030088, problemId: 12865, problemTitle: "평범한 배낭", status: "accepted", language: "C++17", time: "16ms", memory: "4028KB", submittedAt: "2026.05.03 11:40" }
        ],
        solvedProblems: [
            { id: 1753, title: "최단경로", difficulty: "Hard", solvedAt: "2026.05.03", tags: ["다익스트라", "그래프"] },
            { id: 1916, title: "최소비용 구하기", difficulty: "Hard", solvedAt: "2026.05.03", tags: ["다익스트라"] },
            { id: 12865, title: "평범한 배낭", difficulty: "Hard", solvedAt: "2026.05.03", tags: ["DP", "배낭"] }
        ]
    }
];

const tabLabels: Record<PublicProfileTab, string> = {
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

function getProfile(handle: string) {
    return profiles.find((profile) => profile.user.handle.toLowerCase() === handle.toLowerCase());
}

function createActivityItems(profile: ProfileBundle) {
    const [latestSubmission] = profile.submissions;
    const [latestSolved] = profile.solvedProblems;

    return [
        {
            title: `${latestSolved?.title ?? "문제"} 문제를 해결했습니다.`,
            description: `${profile.user.name}님이 최근 해결한 문제입니다.`,
            time: latestSolved?.solvedAt ?? profile.user.lastActiveAt,
            icon: CheckCircle2,
            href: latestSolved ? `/problems/${latestSolved.id}` : "/problems"
        },
        {
            title: `최근 제출 결과: ${latestSubmission?.problemTitle ?? "제출"}`,
            description: `${latestSubmission?.language ?? profile.user.mainLanguage}로 제출했습니다.`,
            time: latestSubmission?.submittedAt ?? profile.user.lastActiveAt,
            icon: ListChecks,
            href: latestSubmission ? `/submissions/${latestSubmission.id}` : "/submissions"
        },
        {
            title: `${profile.stats.streakDays}일 연속 학습 중입니다.`,
            description: "꾸준히 문제 풀이 기록을 이어가고 있습니다.",
            time: profile.user.lastActiveAt,
            icon: Flame,
            href: "/ranking"
        },
        {
            title: `랭킹 #${profile.stats.rank}을 기록했습니다.`,
            description: `현재 점수는 ${profile.stats.score.toLocaleString()}점입니다.`,
            time: profile.user.lastActiveAt,
            icon: Medal,
            href: "/ranking"
        }
    ];
}

function TabButton({ tab, activeTab, onClick }: { tab: PublicProfileTab; activeTab: PublicProfileTab; onClick: (tab: PublicProfileTab) => void }) {
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

function PublicProfileSummary({ profile }: { profile: ProfileBundle }) {
    const { user } = profile;

    return (
        <Card className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-slate-950 text-white shadow-sm">
                    <UserRound className="h-12 w-12" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={user.tier === "Diamond" ? "blue" : user.tier === "Gold" ? "amber" : "default"}>{user.tier}</Badge>
                        <Badge variant="blue">Rank #{user.rank}</Badge>
                        <Badge variant="orange"><Flame className="mr-1 h-3.5 w-3.5" />{user.streakDays}일 연속</Badge>
                        {user.isFollowing && <Badge variant="green">팔로잉</Badge>}
                    </div>

                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{user.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-400">@{user.handle}</p>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">{user.bio}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {user.favoriteTags?.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                    <AppLinkButton href="/ranking" variant="primary" icon={Medal}>
                        랭킹 보기
                    </AppLinkButton>
                    <AppLinkButton href="/profile" variant="secondary" icon={UserRound}>
                        내 프로필
                    </AppLinkButton>
                </div>
            </div>
        </Card>
    );
}

function OverviewTab({ profile }: { profile: ProfileBundle }) {
    return (
        <div className="space-y-4">
            <PublicProfileSummary profile={profile} />

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-black text-slate-950">월별 해결 추이</h3>
                        <BarChart3 className="h-5 w-5 text-blue-600"/>
                    </div>
                    <div className="space-y-3">
                        {profile.monthly.map((point) => <MonthlyRow
                        key={point.month} point={point} max={Math.max(...profile.monthly.map((item) => item.solved))} />)}
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-black text-slate-950">태그별 강점</h3>
                        <Star className="h-5 w-5 text-blue-600"/>
                    </div>
                    <div className="space-y-3">
                        {profile.tagStats.slice(0, 5).map((tag) => <TagProgress key={tag.tag} item={tag} />)}
                    </div>
                </Card>

            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <ProfileMetricPanel label="팔로워" value={profile.user.followers.toLocaleString()} icon={UsersRound} />
                <ProfileMetricPanel label="팔로잉" value={profile.user.following.toLocaleString()} icon={UserRound} />
                <ProfileMetricPanel label="참여 테스트" value={profile.stats.contests.toLocaleString()} icon={Trophy} />
            </div>
        </div>
    );
}

function MonthlyRow({ point, max }: { point: MonthlyPoint; max: number }) {
    const percent = Math.round((point.solved / Math.max(max, 1)) * 100);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="text-slate-700">{point.month}</span>
                <span className="text-slate-500">{point.solved}문제</span>
            </div>
            <ProgressBar value={percent} />
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

function ProfileMetricPanel({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
    return (
        <Card className="p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
                </div>
            </div>
        </Card>
    );
}

function SubmissionsTab({ submissions }: { submissions: SubmissionItem[] }) {
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
                    {submissions.map((submission) => (
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

function SolvedTab({ problems }: { problems: SolvedProblem[] }) {
    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {problems.map((problem) => (
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

function ActivityTab({ profile }: { profile: ProfileBundle }) {
    return (
        <Card className="p-5">
            <ActivityList items={createActivityItems(profile)} />
        </Card>
    );
}

function ContactPanel({ user }: { user: PublicUser }) {
    return (
        <SidePanel title="프로필 정보" badge={<UserRound className="h-5 w-5 text-blue-600" />}>
            <div className="space-y-2">
                <InfoRow icon={CalendarDays} label="가입일" value={user.joinedAt} />
                <InfoRow icon={Clock3} label="최근 활동" value={user.lastActiveAt} />
                <InfoRow icon={Globe2} label="지역" value={user.location} />
                {user.website && <InfoRow icon={Globe2} label="웹사이트" value={user.website} href={user.website} />}
                {user.github && <InfoRow icon={FaGithub} label="GitHub" value={user.github} />}
                {user.email && <InfoRow icon={Mail} label="이메일" value={user.email} />}
            </div>
        </SidePanel>
    );
}

function InfoRow({ icon: Icon, label, value, href }: { icon: ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
    const content = (
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-blue-50">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="min-w-0">
                <p className="text-xs font-black text-slate-400">{label}</p>
                <p className="mt-1 break-all text-slate-700">{value}</p>
            </div>
        </div>
    );

    return href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : content;
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

function NotFoundProfile({ handle }: { handle: string }) {
    return (
        <AppShell title="프로필을 찾을 수 없습니다" description="요청한 사용자가 현재 로컬 데이터에 없습니다.">
            <EmptyState
                title={`@${handle} 사용자를 찾을 수 없습니다.`}
                description="사용자 핸들을 다시 확인하거나 랭킹 페이지에서 사용자를 찾아보세요."
                icon={Search}
                action={
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <AppLinkButton href="/ranking" variant="dark" icon={Medal}>랭킹으로 이동</AppLinkButton>
                        <AppLinkButton href="/profile" variant="secondary" icon={ArrowLeft}>내 프로필</AppLinkButton>
                    </div>
                }
            />
        </AppShell>
    );
}

export default function PublicProfilePage() {
    const params = useParams<{ handle: string }>();
    const handle = String(params.handle ?? "");
    const profile = getProfile(handle);
    const [activeTab, setActiveTab] = useState<PublicProfileTab>("overview");

    const acceptedRate = useMemo(() => {
        if (!profile) return 0;
        return Math.round((profile.stats.accepted / Math.max(profile.stats.submissions, 1)) * 1000) / 10;
    }, [profile]);

    if (!profile) {
        return <NotFoundProfile handle={handle} />;
    }

    const { user, stats } = profile;

    return (
        <AppShell title={`${user.name} 프로필`} description={`@${user.handle} · Rank #${user.rank} · ${user.tier}`}>
            <div className="space-y-6">
                <PageHero
                    eyebrow={
                        <>
                            <Link href="/ranking" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white transition hover:bg-white/15">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                랭킹
                            </Link>
                            <Badge variant="blue">Public Profile</Badge>
                            <Badge variant={user.tier === "Diamond" ? "blue" : user.tier === "Gold" ? "amber" : "default"}>{user.tier}</Badge>
                            <Badge variant="orange"><Flame className="mr-1 h-3.5 w-3.5" />{user.streakDays}일 연속</Badge>
                        </>
                    }
                    title={`${user.name}님의 공개 프로필`}
                    description={user.bio}
                    icon={UserRound}
                    rightTitle="현재 점수"
                    rightValue={stats.score.toLocaleString()}
                    rightCaption={`전체 랭킹 #${stats.rank}`}
                    metrics={[
                        { label: "해결", value: `${stats.solved}` },
                        { label: "정답률", value: `${stats.accuracy}%` },
                        { label: "팔로워", value: `${user.followers}` }
                    ]}
                    actions={
                        <>
                            <AppLinkButton href="/ranking" variant="primary" size="lg" iconRight={ArrowRight}>랭킹 보기</AppLinkButton>
                            <AppLinkButton href="/profile" variant="white" size="lg" icon={UserRound}>내 프로필</AppLinkButton>
                        </>
                    }
                />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="해결 문제" value={stats.solved.toLocaleString()} caption="공개 해결 수" icon={CheckCircle2} tone="green" />
                    <StatCard label="제출" value={stats.submissions.toLocaleString()} caption={`AC ${stats.accepted} / WA ${stats.wrong}`} icon={ListChecks} tone="blue" />
                    <StatCard label="정답률" value={`${acceptedRate}%`} caption="제출 기준 통과율" icon={Gauge} tone="orange" />
                    <StatCard label="연속 학습" value={`${stats.streakDays}일`} caption="현재 스트릭" icon={Flame} tone="red" />
                </section>

                <section className="grid gap-6 2xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <Card className="p-2">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {(["overview", "submissions", "solved", "activity"] as PublicProfileTab[]).map((tab) => (
                                    <TabButton key={tab} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
                                ))}
                            </div>
                        </Card>

                        {activeTab === "overview" && <OverviewTab profile={profile} />}
                        {activeTab === "submissions" && <SubmissionsTab submissions={profile.submissions} />}
                        {activeTab === "solved" && <SolvedTab problems={profile.solvedProblems} />}
                        {activeTab === "activity" && <ActivityTab profile={profile} />}
                    </div>

                    <aside className="space-y-4">
                        <SidePanel title="사용자 카드" badge={<UserRound className="h-5 w-5 text-blue-600" />}>
                            <UserCard user={user} />
                        </SidePanel>

                        <SidePanel title="랭킹 요약" badge={<Medal className="h-5 w-5 text-amber-500" />}>
                            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                                <p className="text-sm font-black text-slate-300">현재 랭킹</p>
                                <p className="mt-1 text-5xl font-black">#{stats.rank}</p>
                                <ProgressBar value={Math.max(5, 100 - stats.rank / 2)} className="mt-5 bg-white/10" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <MiniStat label="점수" value={stats.score.toLocaleString()} />
                                <MiniStat label="티어" value={user.tier} />
                                <MiniStat label="테스트" value={`${stats.contests}`} />
                            </div>
                        </SidePanel>

                        <ContactPanel user={user} />

                        <SidePanel title="강점 태그" badge={<Sparkles className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                {profile.tagStats.map((tag) => (
                                    <Link key={tag.tag} href={tag.href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                                        #{tag.tag}
                                        <span className="text-slate-400">{tag.solved}/{tag.total}</span>
                                    </Link>
                                ))}
                            </div>
                        </SidePanel>

                        <SidePanel title="빠른 이동" badge={<Zap className="h-5 w-5 text-blue-600" />}>
                            <div className="space-y-2">
                                <QuickLink href="/ranking" label="랭킹" icon={Medal} />
                                <QuickLink href="/problems" label="문제 검색" icon={BookOpen} />
                                <QuickLink href="/submissions" label="전체 제출" icon={History} />
                                <QuickLink href="/profile" label="내 프로필" icon={UserRound} />
                            </div>
                        </SidePanel>

                        <Notice title="DB 연결 메모" variant="info">
                            현재 `/profile/[handle]`은 샘플 공개 사용자 데이터 기반입니다. API는 `GET /api/users/:handle`, `GET /api/users/:handle/submissions`, `GET /api/users/:handle/activity`를 붙이면 됩니다.
                        </Notice>
                    </aside>
                </section>
            </div>
        </AppShell>
    );
}
