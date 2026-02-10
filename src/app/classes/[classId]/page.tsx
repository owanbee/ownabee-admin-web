"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  School,
  Tablet,
  ArrowLeft,
  UserCircle,
  UserCheck,
  Building2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { InstitutionClass, SharedTablet, Student, ClassTeacher } from "@/types";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = React.useState<InstitutionClass | null>(null);
  const [sharedTablets, setSharedTablets] = React.useState<SharedTablet[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<ClassTeacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const classInfo = await api.getClass(classId);
        setClassData(classInfo);

        // Fetch related data for this class
        const [tabletsData, studentsData, teachersData] = await Promise.all([
          api.getSharedTablets({ institutionClassId: classId }),
          api.getStudents({ institutionClassId: classId }),
          api.getClassTeachers(classId),
        ]);
        setSharedTablets(tabletsData.tablets);
        setStudents(studentsData.students);
        setTeachers(teachersData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [classId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading class details..." />
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={School}
          title="Class not found"
          description="The class you're looking for doesn't exist."
          action={
            <Button onClick={() => router.push("/classes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classes
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={classData.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Classes", href: "/classes" },
          { label: classData.name },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/classes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-800 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Class Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{classData.name}</h2>
              {classData.institution && (
                <p className="text-sm text-gray-500">{classData.institution.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <UserCircle className="mr-1 h-3 w-3" />
                {students.length} students
              </Badge>
              <Badge variant="secondary">
                <Tablet className="mr-1 h-3 w-3" />
                {sharedTablets.length} tablets
              </Badge>
              <Badge variant="secondary">
                <UserCheck className="mr-1 h-3 w-3" />
                {teachers.length} teachers
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Students Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <EmptyState
                title="No students"
                description="No students have been added to this class yet."
              />
            ) : (
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        {student.studentNumber && (
                          <p className="text-sm text-gray-500">#{student.studentNumber}</p>
                        )}
                      </div>
                      {student.grade && <Badge variant="secondary">{student.grade}</Badge>}
                    </div>
                  </Link>
                ))}
                {students.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{students.length - 5} more students
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teachers Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <EmptyState
                title="No teachers"
                description="No teachers have been assigned to this class yet."
              />
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar src={teacher.user.picture} name={teacher.user.name} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {teacher.user.name || teacher.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{teacher.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shared Tablets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            Shared Tablets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sharedTablets.length === 0 ? (
            <EmptyState
              icon={Tablet}
              title="No shared tablets"
              description="This class doesn't have any shared tablets yet."
            />
          ) : (
            <div className="space-y-3">
              {sharedTablets.slice(0, 5).map((tablet) => (
                <Link
                  key={tablet.id}
                  href={`/shared-tablets/${tablet.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{tablet.name}</p>
                      <p className="text-sm text-gray-500">@{tablet.username}</p>
                    </div>
                    {tablet.memo && <p className="text-xs text-gray-400">{tablet.memo}</p>}
                  </div>
                </Link>
              ))}
              {sharedTablets.length > 5 && (
                <p className="text-center text-sm text-gray-500">
                  +{sharedTablets.length - 5} more tablets
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
