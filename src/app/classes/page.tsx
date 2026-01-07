"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, Users, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import type { InstitutionClass } from "@/types";

export default function ClassesPage() {
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchClasses() {
      try {
        const data = await api.getMyClasses();
        setClasses(data);
      } catch (err) {
        console.error("Failed to fetch classes:", err);
        setError(err instanceof Error ? err.message : "Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    }

    fetchClasses();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading classes..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Classes"
        description="View and manage students in your accessible classes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Classes" },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes found"
          description="You don't have access to any classes yet. Contact your administrator if you believe this is an error."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {cls.name}
                        </h3>
                        {cls.institution && (
                          <p className="text-sm text-gray-500">
                            {cls.institution.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  {cls.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {cls.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {cls._count?.students || 0} students
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
