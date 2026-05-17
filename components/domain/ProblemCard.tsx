
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { AppLinkButton } from "@/components/ui/AppButton";
import DifficultyBadge, { type Difficulty } from "@/components/domain/DifficultyBadge";
import ProblemStatusBadge, { type ProblemStatus } from "@/components/domain/ProblemStatusBadge";

export type ProblemCardData = {
    id: number;
    title: string;
    difficulty: Difficulty;
    score?: number;
    status?: ProblemStatus;
    solvedRate?: number;
    submissions?: number;
    timeLimit?: string;
    memoryLimit?: string;
    tags?: string[];
    memo?: string;
    recommendedOrder?: number;
};

export default function ProblemCard({ problem }: { problem: ProblemCardData }) {
    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <DifficultyBadge value={problem.difficulty} />
                        {problem.status && <ProblemStatusBadge value={problem.status} />}
                        {problem.score !== undefined && <Badge variant="blue">{problem.score}점</Badge>}
                    </div>

                    <Link href={`/problems/${problem.id}`} className="text-xl font-black tracking-tight text-slate-950 transition hover:text-blue-600">
                        {problem.id}. {problem.title}
                    </Link>

                    {problem.memo && <p className="mt-3 text-sm leading-7 text-slate-500">{problem.memo}</p>}

                    {problem.tags && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {problem.tags.slice(0, 5).map((tag) => <Badge key={tag}>#{tag}</Badge>)}
                        </div>
                    )}
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[340px]">
                    <MetricBox label="정답률" value={problem.solvedRate !== undefined ? `${problem.solvedRate}%` : "-"} />
                    <MetricBox label="제출" value={problem.submissions?.toLocaleString() ?? "-"} />
                    <MetricBox label="시간" value={problem.timeLimit ?? "-"} />
                    <MetricBox label="메모리" value={problem.memoryLimit ?? "-"} />
                </div>
            </div>

            {problem.solvedRate !== undefined && (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm font-black">
                        <span className="text-slate-600">정답률</span>
                        <span className="text-blue-600">{problem.solvedRate}%</span>
                    </div>
                    <ProgressBar value={problem.solvedRate} className="bg-white" />
                </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    {problem.recommendedOrder !== undefined && (
                        <>
                            <Target className="h-4 w-4" />
                            추천 순서 {problem.recommendedOrder}
                        </>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <AppLinkButton href={`/problems/${problem.id}`} variant="secondary">문제 보기</AppLinkButton>
                    <AppLinkButton href={`/problems/${problem.id}/solve`} variant="primary" iconRight={ArrowRight}>풀기</AppLinkButton>
                </div>
            </div>
        </Card>
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