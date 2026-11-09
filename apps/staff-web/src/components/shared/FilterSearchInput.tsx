"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface FilterSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
}

export function FilterSearchInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: FilterSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState({ source: value, text: value });

  if (search.source !== value) {
    setSearch({ source: value, text: value });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.text !== value) onChange(search.text);
    }, 300);
    return () => clearTimeout(timer);
  }, [search.text, value, onChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        ref={inputRef}
        type="text"
        value={search.text}
        onChange={(event) =>
          setSearch({ source: value, text: event.target.value })
        }
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={maxLength}
        className="h-9.5 pr-12 pl-9"
      />
      <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center rounded-app-sm bg-secondary px-1.5 py-0.5 text-label font-bold text-muted">
        F2
      </div>
    </div>
  );
}
