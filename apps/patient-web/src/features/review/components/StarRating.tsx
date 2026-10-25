"use client";

import { useState } from "react";
import { Star } from "@/components/layout/icons";

type Props = {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "lg";
  label: string;
};

export default function StarRating({ value, onChange, size = "sm", label }: Props) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const cls = size === "lg" ? "h-9 w-9" : "h-5 w-5";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sao`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="transition hover:scale-110"
        >
          <Star className={`${cls} ${n <= shown ? "text-amber-400" : "text-slate-200"}`} />
        </button>
      ))}
    </div>
  );
}