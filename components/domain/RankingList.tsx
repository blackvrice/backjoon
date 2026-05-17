
import Link from "next/link";

export type RankingItem = {
    rank: number;
    name: string;
    score: string;
    href: string;
};

export default function RankingList({ items }: { items: RankingItem[] }) {
    return (
        <div className="space-y-2">
            {items.map((item) => (
                <Link key={`${item.rank}-${item.name}`} href={item.href} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-blue-50">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${item.rank === 1 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500"}`}>
                            {item.rank}
                        </div>
                        <p className="text-sm font-black text-slate-700">{item.name}</p>
                    </div>
                    <p className="text-sm font-black text-slate-950">{item.score}</p>
                </Link>
            ))}
        </div>
    );
}

