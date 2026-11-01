"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  History,
  Settings,
  ShieldCheck,
  X,
  ChevronDown,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import {
  canAccessStaffPath,
  getPostLoginDestination,
  isStaffRole,
} from "@/features/auth/authRoutes";
import type { UserRole } from "@/features/auth/types/authTypes";

interface StaffSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  role?: UserRole;
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

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Tiếp nhận bệnh nhân",
    href: "/reception",
    icon: UserCheck,
  },
  {
    label: "Hàng chờ khám",
    href: "/queues",
    icon: Clock,
  },
  {
    label: "Quản lý khám bệnh",
    href: "/examinations",
    icon: Stethoscope,
  },
  {
    label: "Hàng chờ bác sĩ",
    href: "/examinations/queue",
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
    label: "Lịch làm việc của tôi",
    href: "/schedules/calendar",
    icon: CalendarCheck,
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
    icon: History,
  },
  {
    label: "Cài đặt hệ thống",
    href: "/settings",
    icon: Settings,
  },
];

export function getNavItemsByRole(role?: string): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccessStaffPath(role, item.href));
}

export function StaffSidebar({
  isOpen = false,
  onClose,
  role,
}: StaffSidebarProps) {
  const pathname = usePathname();
  const { data: currentUser } = useGetAuthUserQuery();

  const currentRole = role ?? currentUser?.role;
  const visibleNavItems = getNavItemsByRole(currentRole);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const handleToggleExpand = (href: string, isExpanded: boolean) => {
    setExpandedItems((previous) => ({ ...previous, [href]: !isExpanded }));
  };

  const isCurrentActive = (item: NavItem) => {
    if (item.href === "/examinations") {
      return (
        pathname === "/examinations" ||
        (pathname.startsWith("/examinations") &&
          !pathname.startsWith("/examinations/queue"))
      );
    }
    if (item.activeMatch) {
      return pathname.startsWith("/doctors") || pathname === "/";
    }
    if (item.children) {
      return (
        pathname.startsWith(item.href) ||
        item.children.some((child) => pathname.startsWith(child.href))
      );
    }
    return (
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href))
    );
  };

  const logoHref = isStaffRole(currentRole)
    ? getPostLoginDestination(currentRole)
    : "/login";

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
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link href={logoHref} className="flex items-center gap-2.5">
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
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(
              item.children && item.children.length > 0,
            );
            const isExpanded =
              expandedItems[item.href] ?? isCurrentActive(item);
            const isActive = isCurrentActive(item);

            if (hasChildren) {
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => handleToggleExpand(item.href, isExpanded)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-app-md px-3 py-2 text-base transition-all",
                      isActive
                        ? isExpanded
                          ? "bg-surface/50 font-bold text-primary"
                          : "bg-surface font-bold text-primary shadow-xs border-r-3 border-primary"
                        : "font-medium text-muted hover:bg-surface/70 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-primary" : "text-muted",
                      )}
                    />
                    <span className="truncate text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto size-4 shrink-0 transition-transform duration-200",
                        isExpanded
                          ? "rotate-180 text-foreground"
                          : "text-muted",
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
                                : "font-medium text-muted hover:bg-surface/70 hover:text-foreground",
                            )}
                          >
                            {child.icon ? (
                              <child.icon
                                className={cn(
                                  "size-3.5 shrink-0",
                                  isChildActive ? "text-primary" : "text-muted",
                                )}
                              />
                            ) : (
                              <span
                                className={cn(
                                  "size-1.5 shrink-0 rounded-full",
                                  isChildActive ? "bg-primary" : "bg-muted/40",
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
                    : "font-medium text-muted hover:bg-surface/70 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
