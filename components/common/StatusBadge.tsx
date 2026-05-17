
import type { ComponentType } from "react";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";

export type StatusConfig<TStatus extends string> = Record<
    TStatus,
    {
        label: string;
        icon?: ComponentType<{ className?: string }>;
        variant?: BadgeVariant;
        className?: string;
    }
>;

export type StatusBadgeProps<TStatus extends string> = {
    value: TStatus;
    config: StatusConfig<TStatus>;
};

export default function StatusBadge<TStatus extends string>({ value, config }: StatusBadgeProps<TStatus>) {
    const item = config[value];
    const Icon = item.icon;

    return (
        <Badge variant={item.variant ?? "default"} className={item.className}>
            {Icon && <Icon className="mr-1 h-3.5 w-3.5" />}
            {item.label}
        </Badge>
    );
}
