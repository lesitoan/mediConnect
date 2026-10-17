"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "defaultValue"> {
  wrapperClassName?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
}

interface ParsedOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

function extractOptions(children: React.ReactNode): ParsedOption[] {
  const options: ParsedOption[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === "option") {
        const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
        options.push({
          value: String(props.value ?? ""),
          label: props.children,
          disabled: props.disabled,
        });
      } else if ((child.props as { children?: React.ReactNode })?.children) {
        options.push(
          ...extractOptions((child.props as { children?: React.ReactNode }).children)
        );
      }
    }
  });
  return options;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      wrapperClassName,
      children,
      value,
      defaultValue,
      onChange,
      disabled,
      name,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const options = useMemo(() => extractOptions(children), [children]);

    const initialValue = useMemo(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return options[0]?.value ?? "";
    }, [value, defaultValue, options]);

    const [currentValue, setCurrentValue] = useState<string>(initialValue);

    useEffect(() => {
      if (value !== undefined) {
        setCurrentValue(String(value));
      }
    }, [value]);

    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    const selectedOption = useMemo(() => {
      return (
        options.find((opt) => opt.value === currentValue) ||
        options[0]
      );
    }, [options, currentValue]);

    const [openUpwards, setOpenUpwards] = useState(false);

    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpwards(spaceBelow < 220 && rect.top > 220);
      }
      setIsOpen((prev) => !prev);
    };

    const handleSelectOption = (opt: ParsedOption) => {
      if (opt.disabled) return;
      setCurrentValue(opt.value);
      setIsOpen(false);

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = opt.value;
        const changeEvent = new Event("change", { bubbles: true });
        hiddenSelectRef.current.dispatchEvent(changeEvent);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: opt.value, name: name ?? "" },
          currentTarget: { value: opt.value, name: name ?? "" },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div
        ref={containerRef}
        className={cn("relative w-full", isOpen && "z-50", wrapperClassName)}
      >
        {/* Hidden select for full form/react-hook-form integration */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLSelectElement | null>).current =
                node;
            }
          }}
          name={name}
          value={currentValue}
          onChange={onChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {children}
        </select>

        {/* Custom trigger */}
        <button
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-app-md border border-border-strong bg-surface px-3.5 py-1.5 font-sans text-body font-medium text-foreground shadow-2xs transition-all duration-150 cursor-pointer select-none",
            "hover:border-primary/50 hover:bg-surface-hover/50",
            "focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none",
            isOpen && "border-primary ring-3 ring-primary/15 bg-surface",
            disabled && "cursor-not-allowed opacity-50 bg-secondary/30",
            className
          )}
        >
          <span className="truncate text-left">
            {selectedOption ? selectedOption.label : ""}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform duration-200 ml-2",
              isOpen && "rotate-180 text-primary"
            )}
          />
        </button>

        {/* Custom styled dropdown popup menu */}
        {isOpen && (
          <div
            role="listbox"
            className={cn(
              "absolute left-0 z-50 w-full min-w-full overflow-hidden rounded-app-xl border border-border-strong bg-surface p-1 shadow-elevation-popover animate-in fade-in-0 zoom-in-95 duration-100",
              openUpwards
                ? "bottom-[calc(100%+4px)]"
                : "top-[calc(100%+4px)]"
            )}
          >
            <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-clean">
              {options.map((opt) => {
                const isSelected = opt.value === currentValue;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt)}
                    className={cn(
                      "relative flex w-full items-center justify-between rounded-app-md px-3 py-2 font-sans text-body transition-colors cursor-pointer select-none",
                      isSelected
                        ? "bg-primary-light text-primary font-bold"
                        : "text-foreground font-medium hover:bg-item-hover hover:text-foreground",
                      opt.disabled &&
                        "cursor-not-allowed opacity-50 pointer-events-none"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="size-3.5 text-primary shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
