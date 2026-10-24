"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarCheck,
  AlertTriangle,
  Activity,
  Settings,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  X,
  ChevronDown,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StaffSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export interface NavChildItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  activeMatch?: boolean;
  children?: NavChildItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Hàng chờ khám",
    href: "/queues",
    icon: Clock,
  },
  {
    label: "Lịch làm việc & Duyệt",
    href: "/schedules",
    icon: CalendarCheck,
    children: [
      {
        label: "Lịch làm việc",
        href: "/schedules/calendar",
      },
      {
        label: "Yêu cầu chờ duyệt",
        href: "/schedules/approvals",
      },
    ],
  },
  {
    label: "Bác sĩ & Chuyên khoa",
    href: "/doctors",
    icon: Stethoscope,
    activeMatch: true,
  },
  {
    label: "Tài khoản người dùng",
    href: "/users",
    icon: Users,
  },
  {
    label: "Xử lý ngoại lệ",
    href: "/exceptions",
    icon: AlertTriangle,
  },
  {
    label: "Nhật ký hệ thống",
    href: "/audit-logs",
    icon: Activity,
  },
  {
    label: "Cài đặt hệ thống",
    href: "/settings",
    icon: Settings,
  },
];

export function StaffSidebar({ isOpen = false, onClose }: StaffSidebarProps) {
  const pathname = usePathname();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          pathname.startsWith(child.href)
        );
        if (hasActiveChild || pathname.startsWith(item.href)) {
          initial[item.href] = true;
        }
      }
    });
    return initial;
  });

  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) =>
          pathname.startsWith(child.href)
        );
        if (hasActiveChild || pathname.startsWith(item.href)) {
          setExpandedItems((prev) => ({
            ...prev,
            [item.href]: true,
          }));
        }
      }
    });
  }, [pathname]);

  const handleToggleExpand = (href: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  const isCurrentActive = (item: NavItem) => {
    if (item.activeMatch) {
      return pathname.startsWith("/doctors") || pathname === "/";
    }
    if (item.children) {
      return (
        pathname.startsWith(item.href) ||
        item.children.some((child) => pathname.startsWith(child.href))
      );
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng thanh điều hướng"
          className="fixed inset-0 z-40 bg-brand-neutral/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              onClose?.();
            }
          }}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-[256px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/doctors" className="flex items-center gap-2.5">
            <div className="flex size-8.5 items-center justify-center rounded-app-lg bg-primary text-primary-foreground shadow-xs">
              <ShieldCheck className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-body font-bold tracking-tight text-primary leading-tight">
                MediConnect
              </span>
              <span className="text-label font-bold tracking-wider text-muted uppercase leading-tight">
                BỆNH VIỆN & PHÒNG KHÁM
              </span>
            </div>
          </Link>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              className="text-muted hover:text-foreground lg:hidden"
              aria-label="Đóng thanh điều hướng"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isExpanded = Boolean(expandedItems[item.href]);
            const isActive = isCurrentActive(item);

            if (hasChildren) {
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => handleToggleExpand(item.href)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-app-md px-3 py-2 text-base transition-all",
                      isActive
                        ? isExpanded
                          ? "bg-surface/50 font-bold text-primary"
                          : "bg-surface font-bold text-primary shadow-xs border-r-3 border-primary"
                        : "font-medium text-muted hover:bg-surface/70 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-primary" : "text-muted"
                      )}
                    />
                    <span className="truncate text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto size-4 shrink-0 transition-transform duration-200",
                        isExpanded ? "rotate-180 text-foreground" : "text-muted"
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 pl-4 pt-0.5 pb-0.5">
                      {item.children?.map((child) => {
                        const isChildActive = pathname.startsWith(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-2 rounded-app-md px-2.5 py-1.5 text-body transition-all",
                              isChildActive
                                ? "bg-surface font-bold text-primary shadow-xs border-r-3 border-primary"
                                : "font-medium text-muted hover:bg-surface/70 hover:text-foreground"
                            )}
                          >
                            {child.icon ? (
                              <child.icon
                                className={cn(
                                  "size-3.5 shrink-0",
                                  isChildActive ? "text-primary" : "text-muted"
                                )}
                              />
                            ) : (
                              <span
                                className={cn(
                                  "size-1.5 shrink-0 rounded-full",
                                  isChildActive ? "bg-primary" : "bg-muted/40"
                                )}
                              />
                            )}
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 rounded-app-md px-3 py-2 text-base transition-all",
                  isActive
                    ? "bg-surface font-bold text-primary shadow-xs border-r-3 border-primary"
                    : "font-medium text-muted hover:bg-surface/70 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5">
          <div className="rounded-app-lg border border-sidebar-border bg-surface p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex size-6.5 items-center justify-center rounded-app-md bg-brand-secondary-light text-primary">
                <Phone className="size-3" />
              </div>
              <span className="text-caption font-bold text-foreground">
                Hỗ trợ kỹ thuật
              </span>
            </div>
            <p className="mt-1.5 text-label text-muted">
              Tổng đài sự cố y tế 24/7
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-body font-bold text-primary tabular-nums">
                1900 6868
              </span>
              <a
                href="tel:19006868"
                className="flex items-center gap-1 text-label font-semibold text-primary hover:underline"
              >
                <span>Gọi ngay</span>
                <ArrowUpRight className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
