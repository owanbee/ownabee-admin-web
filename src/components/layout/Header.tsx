"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoleDisplayName } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { user, portalInfo, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get unique institution roles
  const institutionRoles = React.useMemo(() => {
    if (!portalInfo?.institutionMemberships) return [];
    const roles = new Set(portalInfo.institutionMemberships.map((r) => r.role));
    return Array.from(roles);
  }, [portalInfo]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Page title area - can be used by pages */}
      <div className="flex items-center gap-4 lg:pl-0 pl-12">
        {/* Placeholder for breadcrumbs or page title */}
      </div>

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100"
        >
          <Avatar src={user.picture} name={user.name} size="sm" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user.name || user.email}
            </p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              <Badge variant="secondary">
                {getRoleDisplayName(user.globalRole)}
              </Badge>
              {institutionRoles.map((role) => (
                <Badge key={role} variant="default" className="text-xs">
                  {role === "INSTITUTION_ADMIN" ? "Admin" : "Teacher"}
                </Badge>
              ))}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-md border bg-white py-1 shadow-lg">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {getRoleDisplayName(user.globalRole)}
                </Badge>
                {portalInfo?.institutionMemberships?.map((membership) => (
                  <Badge key={membership.institutionId} variant="default" className="text-xs">
                    {membership.role === "INSTITUTION_ADMIN" ? "Admin" : "Teacher"} @ {membership.institutionName}
                  </Badge>
                ))}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
