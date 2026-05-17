
import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";

export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export type UserCardData = {
    handle: string;
    name: string;
    bio?: string;
    tier: Tier;
    rank: number;
    solved: number;
    submissions: number;
    accuracy: number;
    streakDays?: number;
    mainLanguage: string;
    favoriteTags?: string[];
};

const tierVariant = {
    Bronze: "amber",
    Silver: "default",
    Gold: "amber",
    Platinum: "cyan",
    Diamond: "blue"
} as const;

export default function UserCard({ user }: { user: UserCardData }) {
    return (
        <Link href={`/profile/${user.handle}`} className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-white">
                        <UserRound className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant={tierVariant[user.tier]}>{user.tier}</Badge>
                            <Badge variant="blue">Rank #{user.rank}</Badge>
                            {user.streakDays !== undefined && user.streakDays > 0 && <Badge variant="orange">{user.streakDays}일 연속</Badge>}
                        </div>
                        <h3 className="truncate text-xl font-black text-slate-950">{user.name}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-400">@{user.handle}</p>
                        {user.bio && <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{user.bio}</p>}
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <UserMetric label="해결" value={user.solved.toLocaleString()} />
                <UserMetric label="제출" value={user.submissions.toLocaleString()} />
                <UserMetric label="정답률" value={`${user.accuracy}%`} />
                <UserMetric label="언어" value={user.mainLanguage} />
            </div>

            {user.favoriteTags && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {user.favoriteTags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                </div>
            )}
        </Link>
    );
}

function UserMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
        </div>
    );
}
