
import type { ComponentType, ReactNode } from "react";

export type PageHeroMetric = {
    label: string;
    value: string;
};

export type PageHeroProps = {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    actions?: ReactNode;
    metrics?: PageHeroMetric[];
    rightTitle?: string;
    rightValue?: string;
    rightCaption?: string;
    className?: string;
};

export default function PageHero({
                                     eyebrow,
                                     title,
                                     description,
                                     icon: Icon,
                                     actions,
                                     metrics = [],
                                     rightTitle,
                                     rightValue,
                                     rightCaption,
                                     className = ""
                                 }: PageHeroProps) {
    return (
        <section className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-sm ${className}`}>
            <div className="relative p-7 md:p-8">
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-32 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />

                <div className="relative grid gap-8 xl:grid-cols-[1fr_420px] xl:items-center">
                    <div>
                        {eyebrow && <div className="mb-5 flex flex-wrap gap-2">{eyebrow}</div>}
                        <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-5xl">{title}</h2>
                        {description && <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">{description}</p>}
                        {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
                    </div>

                    {(rightTitle || rightValue || metrics.length > 0) && (
                        <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    {rightTitle && <p className="text-sm font-black text-slate-300">{rightTitle}</p>}
                                    {rightValue && <h3 className="mt-1 text-5xl font-black">{rightValue}</h3>}
                                    {rightCaption && <p className="mt-1 text-sm font-bold text-slate-300">{rightCaption}</p>}
                                </div>
                                {Icon && (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-blue-600">
                                        <Icon className="h-8 w-8" />
                                    </div>
                                )}
                            </div>

                            {metrics.length > 0 && (
                                <div className="mt-5 grid grid-cols-3 gap-3">
                                    {metrics.map((metric) => (
                                        <div key={metric.label} className="rounded-2xl bg-white/10 p-4">
                                            <p className="text-xs font-bold text-slate-300">{metric.label}</p>
                                            <p className="mt-1 text-xl font-black">{metric.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

