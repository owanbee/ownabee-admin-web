"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, School, Calendar, FolderOpen, Building2, Hash, BookOpen, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Student } from "@/types";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [student, setStudent] = React.useState<Student | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchStudent() {
      try {
        const data = await api.getStudent(studentId);
        setStudent(data);
      } catch (err) {
        console.error("Failed to fetch student:", err);
        setError(err instanceof Error ? err.message : "Failed to load student");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStudent();
  }, [studentId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading student details..." />
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student not found</h2>
          <p className="text-gray-500 mb-6">The student you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={student.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Students", href: "/students" },
          { label: student.name },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">{student.name}</h2>
                  {student.username && (
                    <p className="text-sm text-gray-500 mb-4">@{student.username}</p>
                  )}

                  <div className="space-y-3 mt-4">
                    {student.institutionClass && (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">Institution:</span>
                          </div>
                          <span className="text-sm text-gray-900">
                            {student.institutionClass.institution.name}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                            <School className="h-4 w-4" />
                            <span className="font-medium">Class:</span>
                          </div>
                          <span className="text-sm text-gray-900">
                            {student.institutionClass.name}
                          </span>
                        </div>
                      </>
                    )}

                    {student.studentNumber && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <Hash className="h-4 w-4" />
                          <span className="font-medium">Student #:</span>
                        </div>
                        <span className="text-sm text-gray-900">{student.studentNumber}</span>
                      </div>
                    )}

                    {student.grade && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <BookOpen className="h-4 w-4" />
                          <span className="font-medium">Grade:</span>
                        </div>
                        <span className="text-sm text-gray-900">{student.grade}</span>
                      </div>
                    )}

                    {student.memo && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Memo:</span>
                        </div>
                        <span className="text-sm text-gray-900 whitespace-pre-wrap">{student.memo}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created:</span>
                      </div>
                      <span className="text-sm text-gray-900">{formatDate(student.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profiles Section */}
          {student.profiles && student.profiles.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Profiles</h3>
                  </div>
                  <Badge variant="secondary">{student.profiles.length}</Badge>
                </div>

                <div className="space-y-3">
                  {student.profiles.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/students/${profile.id}/portfolios`}
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{profile.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {profile.type}
                            </Badge>
                            {profile.institutionName && (
                              <span className="text-xs text-gray-500">{profile.institutionName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary-600">
                          <FolderOpen className="h-4 w-4" />
                          <span>View Portfolios</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Portfolio Management Card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Management</h3>
              <div className="space-y-3">
                <Link href={`/students/${studentId}/portfolios`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    View Portfolios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
