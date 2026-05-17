
import { CheckCircle2, Clock3, RotateCcw, XCircle } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";

export type ProblemStatus = "solved" | "wrong" | "todo" | "review";

const problemStatusConfig = {
    solved: { label: "해결", icon: CheckCircle2, variant: "green" },
    wrong: { label: "오답", icon: XCircle, variant: "red" },
    todo: { label: "미해결", icon: Clock3, variant: "default" },
    review: { label: "복습", icon: RotateCcw, variant: "blue" }
} as const;

export default function ProblemStatusBadge({ value }: { value: ProblemStatus }) {
    return <StatusBadge value={value} config={problemStatusConfig} />;
}