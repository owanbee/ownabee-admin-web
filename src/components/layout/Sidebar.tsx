"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  School,
  KeyRound,
  Users,
  FolderOpen,
  Menu,
  X,
  Tablet,
  UserCheck,
  ArrowRightLeft,
  UserRoundCog,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useIsOperator } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  operatorOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/students", label: "Students", icon: UserCircle },
  { href: "/shared-tablets", label: "Shared Tablets", icon: Tablet },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/institutions", label: "Institutions", icon: Building2, operatorOnly: true },
  { href: "/admin/classes", label: "Classes", icon: School, operatorOnly: true },
  { href: "/admin/students", label: "Students", icon: UserCircle, operatorOnly: true },
  { href: "/admin/shared-tablets", label: "Shared Tablets", icon: Tablet, operatorOnly: true },
  { href: "/admin/members", label: "Members", icon: Users, operatorOnly: true },
  // B2B Features
  // { href: "/admin/student-codes", label: "Student Codes", icon: KeyRound, operatorOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const isOperator = useIsOperator();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const filteredAdminItems = adminNavItems.filter((item) => !item.operatorOnly || isOperator);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary-100 text-primary-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
        onClick={() => setIsMobileOpen(false)}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">Ownabee</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {/* Main navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Admin section */}
        {filteredAdminItems.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 pt-4">
              Administration
            </h3>
            <div className="space-y-1">
              {filteredAdminItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-gray-400">Ownabee Admin Portal</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition-transform duration-200 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-white lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
