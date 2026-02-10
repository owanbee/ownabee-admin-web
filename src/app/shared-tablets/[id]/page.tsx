"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tablet, Calendar, Building2, Hash, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SharedTablet } from "@/types";

export default function SharedTabletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tabletId = params.id as string;

  const [tablet, setTablet] = React.useState<SharedTablet | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchTablet() {
      try {
        const data = await api.getSharedTablet(tabletId);
        setTablet(data);
      } catch (err) {
        console.error("Failed to fetch tablet:", err);
        setError(err instanceof Error ? err.message : "Failed to load tablet");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTablet();
  }, [tabletId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading tablet details..." />
      </DashboardLayout>
    );
  }

  if (!tablet) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Tablet className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tablet not found</h2>
          <p className="text-gray-500 mb-6">The shared tablet you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/shared-tablets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shared Tablets
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={tablet.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Shared Tablets", href: "/shared-tablets" },
          { label: tablet.name },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/shared-tablets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6">
        {/* Main Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-purple-100 p-4">
                <Tablet className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">{tablet.name}</h2>
                {tablet.username && (
                  <p className="text-sm text-gray-500 mb-4">@{tablet.username}</p>
                )}

                <div className="space-y-3 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Institution:</span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {tablet.institutionName || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Class:</span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {tablet.institutionClassName || "N/A"}
                    </span>
                  </div>

                  {tablet.memo && (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Memo:</span>
                      </div>
                      <span className="text-sm text-gray-900 whitespace-pre-wrap">{tablet.memo}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Created:</span>
                    </div>
                    <span className="text-sm text-gray-900">{formatDate(tablet.createdAt)}</span>
                  </div>

                  {tablet.updatedAt && (
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Updated:</span>
                      </div>
                      <span className="text-sm text-gray-900">{formatDate(tablet.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
