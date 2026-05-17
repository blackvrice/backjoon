
export type ProgressBarProps = {
    value: number;
    max?: number;
    className?: string;
    barClassName?: string;
};

export default function ProgressBar({ value, max = 100, className = "", barClassName = "bg-blue-600" }: ProgressBarProps) {
    const percent = Math.max(0, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));

    return (
        <div className={`h-3 overflow-hidden rounded-full bg-slate-100 ${className}`}>
            <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${percent}%` }} />
        </div>
    );
}
