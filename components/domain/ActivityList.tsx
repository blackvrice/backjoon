
import Link from "next/link";
import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";

export type ActivityItem = {
    id?: string | number;
    title: string;
    description?: string;
    time?: string;
    href?: string;
    icon: ComponentType<{ className?: string }>;
    iconClassName?: string;
};

export default function ActivityList({ items }: { items: ActivityItem[] }) {
    return (
        <div className="space-y-3">
            {items.map((item, index) => {
                const Icon = item.icon;
                const content = (
                    <div className="flex gap-3 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ${item.iconClassName ?? ""}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-800">{item.title}</p>
                            {item.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>}
                            {item.time && <p className="mt-1 text-xs font-bold text-slate-400">{item.time}</p>}
                        </div>
                        {item.href && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                );

                return item.href ? <Link key={item.id ?? index} href={item.href}>{content}</Link> : <div key={item.id ?? index}>{content}</div>;
            })}
        </div>
    );
}

