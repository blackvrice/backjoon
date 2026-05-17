import { AlertTriangle, CheckCircle2, Clock3, FileCode2, RefreshCw, XCircle } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";

export type SubmissionStatus = "accepted" | "wrong" | "timeLimit" | "runtime" | "compile" | "pending" | "judging";

const submissionStatusConfig = {
    accepted: { label: "맞았습니다", icon: CheckCircle2, variant: "green" },
    wrong: { label: "틀렸습니다", icon: XCircle, variant: "red" },
    timeLimit: { label: "시간 초과", icon: Clock3, variant: "orange" },
    runtime: { label: "런타임 에러", icon: AlertTriangle, variant: "orange" },
    compile: { label: "컴파일 에러", icon: FileCode2, variant: "purple" },
    pending: { label: "채점 대기", icon: RefreshCw, variant: "blue" },
    judging: { label: "채점 중", icon: RefreshCw, variant: "blue" }
} as const;

export default function SubmissionStatusBadge({ value }: { value: SubmissionStatus }) {
    return <StatusBadge value={value} config={submissionStatusConfig} />;
}
