"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { LoadingPage } from "@/components/ui/loading";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, isLoading, isInitialized, initialize, _hasHydrated } = useAuthStore();

  React.useEffect(() => {
    // Wait for Zustand to hydrate from localStorage before initializing
    if (_hasHydrated) {
      initialize();
    }
  }, [_hasHydrated, initialize]);

  React.useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  // Wait for both hydration and initialization
  if (!_hasHydrated || !isInitialized || isLoading) {
    return <LoadingPage message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
