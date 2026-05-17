
import Badge from "@/components/ui/Badge";

export type Difficulty = "Easy" | "Medium" | "Hard";

const difficultyVariant = {
    Easy: "green",
    Medium: "orange",
    Hard: "red"
} as const;

export default function DifficultyBadge({ value }: { value: Difficulty }) {
    return <Badge variant={difficultyVariant[value]}>{value}</Badge>;
}
