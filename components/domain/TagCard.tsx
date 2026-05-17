
import Link from "next/link";
import { ArrowRight, Flame, Hash, Star, Tag } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { AppLinkButton } from "@/components/ui/AppButton";

export type TagCategory = "기초" | "자료구조" | "그래프" | "DP" | "문자열" | "수학" | "고급";
export type TagLevel = "입문" | "초급" | "중급" | "고급";

export type TagCardData = {
    id: string;
    name: string;
    description: string;
    category: TagCategory;
    level: TagLevel;
    problemCount: number;
    solvedCount: number;
    solvedRate: number;
    recommended?: boolean;
    trending?: boolean;
    relatedTags?: string[];
};

const categoryVariant = {
    기초: "cyan",
    자료구조: "purple",
    그래프: "blue",
    DP: "red",
    문자열: "green",
    수학: "amber",
    고급: "default"
} as const;

const levelVariant = {
    입문: "cyan",
    초급: "green",
    중급: "orange",
    고급: "red"
} as const;

export default function TagCard({ tag }: { tag: TagCardData }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant={categoryVariant[tag.category]}>{tag.category}</Badge>
                        <Badge variant={levelVariant[tag.level]}>{tag.level}</Badge>
                        {tag.recommended && <Badge variant="blue"><Star className="mr-1 h-3.5 w-3.5" />추천</Badge>}
                        {tag.trending && <Badge variant="orange"><Flame className="mr-1 h-3.5 w-3.5" />인기</Badge>}
                    </div>

                    <Link href={`/tags/${tag.id}`} className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                        <Hash className="h-6 w-6 text-blue-600" />
                        {tag.name}
                    </Link>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{tag.description}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Tag className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                <TagMetric label="문제" value={tag.problemCount.toLocaleString()} />
                <TagMetric label="해결" value={tag.solvedCount.toLocaleString()} />
                <TagMetric label="해결률" value={`${tag.solvedRate}%`} />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">해결률</span>
                    <span className="text-blue-600">{tag.solvedRate}%</span>
                </div>
                <ProgressBar value={tag.solvedRate} className="bg-white" />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {tag.relatedTags?.slice(0, 3).map((related) => <Badge key={related}>{related}</Badge>)}
                </div>
                <AppLinkButton href={`/tags/${tag.id}`} variant="primary" iconRight={ArrowRight}>태그 문제 보기</AppLinkButton>
            </div>
        </div>
    );
}

function TagMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
        </div>
    );
}
