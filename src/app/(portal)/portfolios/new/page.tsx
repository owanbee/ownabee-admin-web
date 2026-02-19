"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioForm } from "@/components/forms/PortfolioForm";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { isApiError } from "@/lib/utils";
import type { Student } from "@/types";

function NewPortfolioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");

  const [student, setStudent] = React.useState<Student | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchStudent() {
      if (!studentId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getPortalStudent(studentId);
        setStudent(data);
      } catch (err) {
        console.error("Failed to fetch student:", err);
        setError(isApiError(err) ? err.message : "Failed to load student");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStudent();
  }, [studentId]);

  if (!studentId) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          Student ID is required to create a portfolio.
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading student information..." />
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error || "Failed to load student information"}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Create Portfolio"
        descriptionNode={
          <div className="flex items-center gap-2 text-base font-medium text-gray-700">
            <User className="h-4 w-4" />
            <span>{student.name}</span>
            {student.studentNumber && (
              <span className="text-sm text-gray-500">({student.studentNumber})</span>
            )}
          </div>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Students", href: "/students" },
          { label: student.name, href: `/students/${studentId}` },
          { label: "Portfolios", href: `/students/${studentId}/portfolios` },
          { label: "New" },
        ]}
      />

      <PortfolioForm
        studentId={studentId}
        onSuccess={() => router.push(`/students/${studentId}/portfolios`)}
        onCancel={() => router.back()}
      />
    </DashboardLayout>
  );
}

export default function NewPortfolioPage() {
  return (
    <Suspense fallback={<LoadingPage message="Loading..." />}>
      <NewPortfolioContent />
    </Suspense>
  );
}
