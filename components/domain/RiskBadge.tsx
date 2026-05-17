
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";

export type RiskLevel = "normal" | "warning" | "danger";

const riskConfig = {
    normal: { label: "정상", icon: ShieldCheck, variant: "green" },
    warning: { label: "주의", icon: AlertTriangle, variant: "orange" },
    danger: { label: "위험", icon: ShieldAlert, variant: "red" }
} as const;

export default function RiskBadge({ value }: { value: RiskLevel }) {
    return <StatusBadge value={value} config={riskConfig} />;
}