import { cn } from "@/lib/utils";
import { getLevelName } from "@/lib/constants";

interface LevelBadgeProps {
  level: number;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LevelBadge({ level, showName = true, size = "md", className }: LevelBadgeProps) {
  const name = getLevelName(level);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-accent/15 border border-accent/25 font-black text-accent tabular-nums",
          size === "sm" && "w-5 h-5 text-[9px]",
          size === "md" && "w-6 h-6 text-xs",
          size === "lg" && "w-8 h-8 text-sm"
        )}
      >
        {level}
      </div>
      {showName && (
        <span
          className={cn(
            "font-semibold text-foreground",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          {name}
        </span>
      )}
    </div>
  );
}
