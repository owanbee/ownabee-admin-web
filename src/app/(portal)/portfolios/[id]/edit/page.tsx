"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioForm } from "@/components/forms/PortfolioForm";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import type { Portfolio } from "@/types";

export default function EditPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const portfolioId = params.id as string;
  const profileId = searchParams.get("profileId");

  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPortfolio() {
      try {
        const data = await api.getPortfolio(portfolioId);
        setPortfolio(data);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setError(err instanceof Error ? err.message : "Failed to load portfolio");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolio();
  }, [portfolioId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading portfolio..." />
      </DashboardLayout>
    );
  }

  if (error || !portfolio) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error || "Portfolio not found"}
        </div>
      </DashboardLayout>
    );
  }

  const backUrl = profileId
    ? `/students/${profileId}/portfolios`
    : `/students/${portfolio.profileId}/portfolios`;

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Portfolio"
        description={`Editing "${portfolio.title}"`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Classes", href: "/classes" },
          { label: "Portfolios", href: backUrl },
          { label: "Edit" },
        ]}
      />

      <PortfolioForm
        portfolioId={portfolioId}
        profileId={portfolio.profileId}
        initialData={portfolio}
        onSuccess={() => router.push(backUrl)}
        onCancel={() => router.back()}
      />
    </DashboardLayout>
  );
}
