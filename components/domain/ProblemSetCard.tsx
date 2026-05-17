
import Link from "next/link";
import { ChevronRight, FolderCode } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Difficulty } from "@/components/domain/DifficultyBadge";

export type ProblemSetCardData = {
    title: string;
    description: string;
    count: number;
    level: Difficulty;
    tags: string[];
    href: string;
};

const difficultyVariant = {
    Easy: "green",
    Medium: "orange",
    Hard: "red"
} as const;

export default function ProblemSetCard({ item }: { item: ProblemSetCardData }) {
    return (
        <Link href={item.href} className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FolderCode className="h-5 w-5" />
                </div>
                <Badge variant={difficultyVariant[item.level]}>{item.level}</Badge>
            </div>

            <h4 className="mt-4 text-lg font-black text-slate-950">{item.title}</h4>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-500">
                <span>{item.count}문제</span>
                <span className="inline-flex items-center gap-1 text-blue-600">
          시작하기
          <ChevronRight className="h-4 w-4" />
        </span>
            </div>
        </Link>
    );
}