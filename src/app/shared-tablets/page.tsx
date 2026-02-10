"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Tablet, GraduationCap, Building2, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SharedTablet, InstitutionClass } from "@/types";

function SharedTabletsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tablets, setTablets] = React.useState<SharedTablet[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    router.push(`/shared-tablets?${params.toString()}`);
  };

  const fetchTablets = React.useCallback(async () => {
    try {
      if (selectedClassId) {
        // Fetch tablets for specific class
        const result = await api.getSharedTablets({ institutionClassId: selectedClassId });
        setTablets(result.tablets);
      } else {
        // Fetch all tablets from all classes
        const data = await api.getMySharedTablets();
        setTablets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tablets:", err);
      setError(err instanceof Error ? err.message : "Failed to load tablets");
    }
  }, [selectedClassId]);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Get URL param first
        const classIdParam = searchParams.get("classId");
        if (classIdParam) setSelectedClassId(classIdParam);

        // Fetch classes
        const classesData = await api.getMyClasses();
        setClasses(classesData);

        // Fetch tablets with URL param
        if (classIdParam) {
          const result = await api.getSharedTablets({ institutionClassId: classIdParam });
          setTablets(result.tablets);
        } else {
          const data = await api.getMySharedTablets();
          setTablets(data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  // Refetch tablets when class filter changes manually
  React.useEffect(() => {
    if (!isLoading) {
      fetchTablets();
    }
  }, [fetchTablets, isLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading shared tablets..." />
      </DashboardLayout>
    );
  }

  const classOptions = [
    { value: "", label: "All Classes" },
    ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="My Shared Tablets"
        description="View shared tablets in your accessible classes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Shared Tablets" }]}
      />
      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Class Filter */}
      <div className="mb-6 max-w-xs">
        <Select
          options={classOptions}
          value={selectedClassId}
          onChange={(e) => handleClassChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {tablets.length === 0 ? (
        <EmptyState
          icon={Tablet}
          title="No shared tablets found"
          description="You don't have access to any shared tablets yet. Contact your administrator if you believe this is an error."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tablets.map((tablet) => (
            <Card key={tablet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <Tablet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tablet.name}</h3>
                      {tablet.username && (
                        <p className="text-sm text-gray-500">@{tablet.username}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{tablet.institutionName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-gray-500">{tablet.institutionClassName}</span>
                  </div>
                </div>
                {tablet.memo && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{tablet.memo}</p>
                )}
                <p className="mt-3 text-xs text-gray-400">Created {formatDate(tablet.createdAt)}</p>
                <div className="mt-4">
                  <Link href={`/admin/shared-tablets/${tablet.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function SharedTabletsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingPage message="Loading shared tablets..." />
        </DashboardLayout>
      }
    >
      <SharedTabletsPageContent />
    </Suspense>
  );
}
