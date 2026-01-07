"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useIsOperator } from "@/stores/authStore";
import { DashboardLayout } from "./DashboardLayout";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const isOperator = useIsOperator();
  const [isChecked, setIsChecked] = React.useState(false);

  React.useEffect(() => {
    // Give time for auth to initialize
    const timer = setTimeout(() => {
      setIsChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (isChecked && !isOperator) {
      router.push("/dashboard");
    }
  }, [isChecked, isOperator, router]);

  if (!isChecked) {
    return null;
  }

  if (!isOperator) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          You don't have permission to access this page. Only operators can access admin features.
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
