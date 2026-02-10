"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsOperator } from "@/stores/authStore";
import { DashboardLayout } from "./DashboardLayout";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const isOperator = useIsOperator();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait 2 seconds for operator verification
    const timeoutId = setTimeout(() => {
      if (!isOperator) {
        // If still not an operator after 2 seconds, redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
      setIsChecking(false);
    }, 1000);

    // If operator is confirmed, clear timeout immediately
    if (isOperator) {
      clearTimeout(timeoutId);
      setIsChecking(false);
    }

    return () => clearTimeout(timeoutId);
  }, [isOperator, router]);

  // Show message while checking or if no permission
  if (!isOperator) {
    return (
      <DashboardLayout>
        <div
          className={`rounded-md p-4 text-sm ${isChecking ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}
        >
          {isChecking
            ? "Checking permissions. Please wait..."
            : "You don't have permission to access this page. Redirecting to dashboard..."}
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
