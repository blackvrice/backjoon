
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppLinkButton, Badge, Card } from "@/components/ui";
import DifficultyBadge, { type Difficulty } from "@/components/domain/DifficultyBadge";
import ProblemStatusBadge, { type ProblemStatus } from "@/components/domain/ProblemStatusBadge";

export type ProblemTableData = {
    id: number;
    title: string;
    difficulty: Difficulty;
    status?: ProblemStatus;
    category?: string;
    score?: number;
    solvedRate?: number;
    submissions?: number;
    timeLimit?: string;
    memoryLimit?: string;
    tags?: string[];
};

export type ProblemTableProps = {
    problems: ProblemTableData[];
    showCategory?: boolean;
    showScore?: boolean;
    showSolvedRate?: boolean;
    showSubmissions?: boolean;
    showLimits?: boolean;
    showTags?: boolean;
    showActions?: boolean;
};

export default function ProblemTable({
                                         problems,
                                         showCategory = true,
                                         showScore = true,
                                         showSolvedRate = true,
                                         showSubmissions = true,
                                         showLimits = true,
                                         showTags = true,
                                         showActions = true
                                     }: ProblemTableProps) {
    return (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                    <tr>
                        <th className="px-5 py-4">문제</th>
                        <th className="px-5 py-4">난이도</th>
                        <th className="px-5 py-4">상태</th>
                        {showCategory && <th className="px-5 py-4">분류</th>}
                        {showScore && <th className="px-5 py-4 text-right">점수</th>}
                        {showSolvedRate && <th className="px-5 py-4 text-right">정답률</th>}
                        {showSubmissions && <th className="px-5 py-4 text-right">제출</th>}
                        {showLimits && <th className="px-5 py-4">제한</th>}
                        {showTags && <th className="px-5 py-4">태그</th>}
                        {showActions && <th className="px-5 py-4" />}
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {problems.map((problem) => (
                        <tr key={problem.id} className="transition hover:bg-slate-50">
                            <td className="px-5 py-4">
                                <Link href={`/problems/${problem.id}`} className="font-black text-slate-950 transition hover:text-blue-600">
                                    {problem.title}
                                </Link>
                                <p className="mt-1 text-xs font-bold text-slate-400">#{problem.id}</p>
                            </td>

                            <td className="px-5 py-4">
                                <DifficultyBadge value={problem.difficulty} />
                            </td>

                            <td className="px-5 py-4">
                                {problem.status ? <ProblemStatusBadge value={problem.status} /> : <span className="text-xs font-bold text-slate-400">-</span>}
                            </td>

                            {showCategory && (
                                <td className="px-5 py-4">
                                    {problem.category ? <Badge>{problem.category}</Badge> : <span className="text-xs font-bold text-slate-400">-</span>}
                                </td>
                            )}

                            {showScore && (
                                <td className="px-5 py-4 text-right font-bold text-slate-600">
                                    {problem.score ?? "-"}
                                </td>
                            )}

                            {showSolvedRate && (
                                <td className="px-5 py-4 text-right font-bold text-slate-600">
                                    {problem.solvedRate !== undefined ? `${problem.solvedRate}%` : "-"}
                                </td>
                            )}

                            {showSubmissions && (
                                <td className="px-5 py-4 text-right font-bold text-slate-600">
                                    {problem.submissions?.toLocaleString() ?? "-"}
                                </td>
                            )}

                            {showLimits && (
                                <td className="px-5 py-4 font-bold text-slate-500">
                                    {problem.timeLimit || problem.memoryLimit ? `${problem.timeLimit ?? "-"} / ${problem.memoryLimit ?? "-"}` : "-"}
                                </td>
                            )}

                            {showTags && (
                                <td className="px-5 py-4">
                                    {problem.tags && problem.tags.length > 0 ? (
                                        <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                            {problem.tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag}>{tag}</Badge>
                                            ))}
                                            {problem.tags.length > 3 && <Badge>+{problem.tags.length - 3}</Badge>}
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">-</span>
                                    )}
                                </td>
                            )}

                            {showActions && (
                                <td className="px-5 py-4 text-right">
                                    <AppLinkButton href={`/problems/${problem.id}/solve`} size="sm" iconRight={ArrowRight}>
                                        풀기
                                    </AppLinkButton>
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
