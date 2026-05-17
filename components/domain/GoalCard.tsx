
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Tag, Trophy, Zap } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import ProgressBar from "@/components/ui/ProgressBar";
import { AppButton, AppLinkButton } from "@/components/ui/AppButton";
import StatusBadge from "@/components/common/StatusBadge";

export type GoalType = "daily" | "weekly" | "monthly" | "tag" | "test";
export type GoalStatus = "active" | "completed" | "paused" | "overdue";
export type GoalPriority = "low" | "medium" | "high";

export type GoalCardData = {
    id: string;
    title: string;
    description: string;
    type: GoalType;
    status: GoalStatus;
    priority: GoalPriority;
    current: number;
    target: number;
    unit: string;
    deadline: string;
    createdAt?: string;
    updatedAt?: string;
    tag?: string;
    linkedHref?: string;
    memo?: string;
};

const goalTypeConfig = {
    daily: { label: "일일", icon: Zap, variant: "cyan" },
    weekly: { label: "주간", icon: Clock3, variant: "blue" },
    monthly: { label: "월간", icon: Trophy, variant: "purple" },
    tag: { label: "태그", icon: Tag, variant: "green" },
    test: { label: "테스트", icon: Trophy, variant: "amber" }
} as const;

const goalStatusConfig = {
    active: { label: "진행 중", icon: Clock3, variant: "blue" },
    completed: { label: "완료", icon: CheckCircle2, variant: "green" },
    paused: { label: "중지", icon: RefreshCw, variant: "default" },
    overdue: { label: "지연", icon: AlertTriangle, variant: "red" }
} as const;

const priorityVariant = {
    low: "default",
    medium: "orange",
    high: "red"
} as const;

const priorityLabel = {
    low: "낮음",
    medium: "보통",
    high: "높음"
} as const;

export default function GoalCard({
                                     goal,
                                     onComplete,
                                     onPause,
                                     onDelete
                                 }: {
    goal: GoalCardData;
    onComplete?: (goal: GoalCardData) => void;
    onPause?: (goal: GoalCardData) => void;
    onDelete?: (goal: GoalCardData) => void;
}) {
    const progress = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
    const barClassName = goal.status === "completed" ? "bg-emerald-600" : goal.status === "overdue" ? "bg-rose-600" : progress >= 80 ? "bg-blue-600" : "bg-orange-500";

    return (
        <Card hover className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <StatusBadge value={goal.type} config={goalTypeConfig} />
                        <StatusBadge value={goal.status} config={goalStatusConfig} />
                        <Badge variant={priorityVariant[goal.priority]}>우선순위 {priorityLabel[goal.priority]}</Badge>
                        {goal.tag && <Badge>#{goal.tag}</Badge>}
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-slate-950">{goal.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{goal.description}</p>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[340px]">
                    <GoalMetric label="진행" value={`${goal.current} / ${goal.target} ${goal.unit}`} />
                    <GoalMetric label="달성률" value={`${progress}%`} />
                    <GoalMetric label="마감" value={goal.deadline} />
                    <GoalMetric label="수정" value={goal.updatedAt ?? "-"} />
                </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="text-slate-600">목표 진행률</span>
                    <span className="text-blue-600">{progress}%</span>
                </div>
                <ProgressBar value={progress} className="bg-white" barClassName={barClassName} />
            </div>

            {goal.memo && <Notice variant="info" title="메모" className="mt-5">{goal.memo}</Notice>}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-bold text-slate-400">{goal.createdAt && `생성 ${goal.createdAt}`}</div>
                <div className="flex flex-wrap gap-2">
                    {goal.linkedHref && <AppLinkButton href={goal.linkedHref}>연결 페이지</AppLinkButton>}
                    {onComplete && <AppButton onClick={() => onComplete(goal)} variant="success" icon={CheckCircle2}>완료</AppButton>}
                    {onPause && <AppButton onClick={() => onPause(goal)} variant="secondary" icon={RefreshCw}>{goal.status === "paused" ? "재개" : "중지"}</AppButton>}
                    {onDelete && <AppButton onClick={() => onDelete(goal)} variant="danger">삭제</AppButton>}
                </div>
            </div>
        </Card>
    );
}

function GoalMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">{label}</p>
            <p className="mt-1 font-black text-slate-950">{value}</p>
        </div>
    );
}
