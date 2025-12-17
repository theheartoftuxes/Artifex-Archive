"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({
  value,
  onChange,
  max = 5,
  readonly = false,
  size = "md",
  className,
}: RatingProps) {
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (newValue: number) => {
    if (!readonly && onChange) {
      onChange(newValue);
    }
  };

  const displayValue = hoveredValue ?? value;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => !readonly && setHoveredValue(starValue)}
            onMouseLeave={() => !readonly && setHoveredValue(null)}
            disabled={readonly}
            className={cn(
              "transition-colors",
              !readonly && "cursor-pointer hover:scale-110",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

