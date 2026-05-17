
import { Search } from "lucide-react";

export type SearchInputProps = {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export default function SearchInput({ label = "검색어", value, onChange, placeholder = "검색어 입력", className = "" }: SearchInputProps) {
    return (
        <label className={`block ${className}`}>
            {label && <span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4"
                />
            </div>
        </label>
    );
}