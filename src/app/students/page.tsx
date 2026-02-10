"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { UserCircle, GraduationCap, FolderOpen, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { StudentProfile, InstitutionClass } from "@/types";

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [students, setStudents] = React.useState<StudentProfile[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    router.push(`/students?${params.toString()}`);
  };

  const fetchStudents = React.useCallback(async () => {
    try {
      if (selectedClassId) {
        // Fetch students for specific class
        const data = await api.getClassStudents(selectedClassId);
        setStudents(data);
      } else {
        // Fetch all students from all classes
        const data = await api.getMyStudents();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(err instanceof Error ? err.message : "Failed to load students");
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

        // Fetch students with URL param
        if (classIdParam) {
          const data = await api.getClassStudents(classIdParam);
          setStudents(data);
        } else {
          const data = await api.getMyStudents();
          setStudents(data);
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

  // Refetch students when class filter changes manually
  React.useEffect(() => {
    if (!isLoading) {
      fetchStudents();
    }
  }, [fetchStudents, isLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading students..." />
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
        title="My Students"
        description="View and manage students in your accessible classes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Students" }]}
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

      {students.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No students found"
          description="You don't have access to any students yet. Contact your administrator if you believe this is an error."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      {student.institutionName && (
                        <p className="text-sm text-gray-500">{student.institutionName}</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400">Joined {formatDate(student.createdAt)}</p>
                <div className="mt-4">
                  <Link href={`/students/${student.id}/portfolios`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      View Portfolios
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

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingPage message="Loading students..." />
        </DashboardLayout>
      }
    >
      <StudentsPageContent />
    </Suspense>
  );
}
