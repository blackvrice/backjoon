
export type FilterSelectProps<TValue extends string = string> = {
    label: string;
    value: TValue;
    onChange: (value: TValue) => void;
    options: readonly TValue[];
    className?: string;
};

export default function FilterSelect<TValue extends string>({ label, value, onChange, options, className = "" }: FilterSelectProps<TValue>) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value as TValue)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition focus:border-blue-300 focus:ring-4"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

