"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { User, FolderOpen, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { StudentProfile, InstitutionClass } from "@/types";

export default function ClassStudentsPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [classInfo, setClassInfo] = React.useState<InstitutionClass | null>(null);
  const [students, setStudents] = React.useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [studentsData] = await Promise.all([
          api.getClassStudents(classId),
        ]);
        setStudents(studentsData);

        // Try to get class info from the students data or separately
        // For now, we'll just show the students
      } catch (err) {
        console.error("Failed to fetch class data:", err);
        setError(err instanceof Error ? err.message : "Failed to load class data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [classId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading students..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Class Students"
        description="View students and manage their portfolios"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Classes", href: "/classes" },
          { label: "Students" },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {students.length === 0 ? (
        <EmptyState
          icon={User}
          title="No students found"
          description="This class doesn't have any students yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/students/${student.id}/portfolios`}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={student.picture}
                        name={student.name}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Joined {formatDate(student.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <FolderOpen className="h-4 w-4" />
                    <span>View Portfolios</span>
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
