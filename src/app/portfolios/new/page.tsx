"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioForm } from "@/components/forms/PortfolioForm";
import { LoadingPage } from "@/components/ui/loading";

function NewPortfolioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          Profile ID is required to create a portfolio.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Create Portfolio"
        description="Create a new portfolio for this student"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Classes", href: "/classes" },
          { label: "Portfolios", href: `/students/${profileId}/portfolios` },
          { label: "New Portfolio" },
        ]}
      />

      <PortfolioForm
        profileId={profileId}
        onSuccess={() => router.push(`/students/${profileId}/portfolios`)}
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
