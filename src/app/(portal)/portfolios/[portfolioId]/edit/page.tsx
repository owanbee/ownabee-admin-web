"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioForm } from "@/components/forms/PortfolioForm";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { isApiError } from "@/lib/utils";
import type { Portfolio, Student } from "@/types";

export default function EditPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const portfolioId = params.portfolioId as string;
  const studentId = searchParams.get("studentId");

  const [student, setStudent] = React.useState<Student | null>(null);
  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      if (!studentId) {
        setError("Student ID is required");
        setIsLoading(false);
        return;
      }

      try {
        const [studentData, portfolioData] = await Promise.all([
          api.getPortalStudent(studentId),
          api.getPortalPortfolio(studentId, portfolioId),
        ]);
        setStudent(studentData);
        setPortfolio(portfolioData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(isApiError(err) ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [portfolioId, studentId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading portfolio..." />
      </DashboardLayout>
    );
  }

  if (error || !portfolio || !studentId || !student) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error || "Portfolio not found or Student ID missing"}
        </div>
      </DashboardLayout>
    );
  }

  const backUrl = `/students/${studentId}/portfolios`;

  return (
    <DashboardLayout>
      <PageHeader
        title={`Edit: ${portfolio.title}`}
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
          { label: "Portfolios", href: backUrl },
          { label: "Edit" },
        ]}
      />

      <PortfolioForm
        portfolioId={portfolioId}
        studentId={studentId}
        initialData={portfolio}
        onSuccess={() => router.push(backUrl)}
        onCancel={() => router.back()}
      />
    </DashboardLayout>
  );
}
