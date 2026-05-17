export function formatDate(value?: Date | string | null) {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date).replace(/\. /g, ".");
}

export function toDifficulty(value?: string | null) {
    if (value === "Hard" || value === "Medium" || value === "Easy") return value;
    return "Easy";
}

export function toProblemStatus(status?: string | null) {
    if (status === "published") return "todo";
    if (status === "review") return "review";
    if (status === "hidden" || status === "archived") return "todo";
    return "todo";
}

export function formatTimeLimit(ms?: number | null) {
    if (!ms) return "-";
    if (ms % 1000 === 0) return `${ms / 1000}초`;
    return `${ms}ms`;
}

export function formatMemoryLimit(mb?: number | null) {
    if (!mb) return "-";
    return `${mb}MB`;
}

export function formatMemoryKb(kb?: number | null) {
    if (kb == null) return "-";
    if (kb >= 1024) return `${Math.round((kb / 1024) * 10) / 10}MB`;
    return `${kb}KB`;
}

export function acceptedRate(total: number, accepted: number) {
    return total > 0 ? Math.round((accepted / total) * 1000) / 10 : 0;
}
