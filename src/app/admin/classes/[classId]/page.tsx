"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Tablet,
  ArrowLeft,
  UserCircle,
  UserCheck,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  // Delete class confirmation
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = React.useState(false);
  const [isDeletingClass, setIsDeletingClass] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
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
  }, [classId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteClass = async () => {
    setIsDeletingClass(true);
    setError(null);

    try {
      await api.deleteClass(classId);
      router.push("/admin/classes");
    } catch (err: any) {
      console.error("Failed to delete class:", err);
      setError(err.message || "Failed to delete class");
      setIsDeletingClass(false);
      setIsDeleteClassModalOpen(false);
    }
  };

  const canDeleteClass = students.length === 0 && sharedTablets.length === 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading class details..." />
      </AdminLayout>
    );
  }

  if (!classData) {
    return (
      <AdminLayout>
        <EmptyState
          icon={GraduationCap}
          title="Class not found"
          description="The class you're looking for doesn't exist."
          action={
            <Button onClick={() => router.push("/admin/classes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classes
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={classData.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Classes", href: "/admin/classes" },
          { label: classData.name },
        ]}
        action={
          <div className="flex gap-2">
            {canDeleteClass && (
              <Button variant="destructive" onClick={() => setIsDeleteClassModalOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Class
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/admin/classes")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
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
              <GraduationCap className="h-6 w-6 text-blue-600" />
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Students
            </CardTitle>
            <Link
              href={`/admin/students?institutionId=${classData.institution?.id}&classId=${classId}`}
            >
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Students
              </Button>
            </Link>
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
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      {student.studentNumber && (
                        <p className="text-sm text-gray-500">#{student.studentNumber}</p>
                      )}
                    </div>
                    {student.grade && <Badge variant="secondary">{student.grade}</Badge>}
                  </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Teachers
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{teachers.length} total</Badge>
            </div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            Shared Tablets
          </CardTitle>
          <Link
            href={`/admin/shared-tablets?institutionId=${classData.institution?.id}&classId=${classId}`}
          >
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Tablets
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {sharedTablets.length === 0 ? (
            <EmptyState
              icon={Tablet}
              title="No shared tablets"
              description="Go to Shared Tablets menu to add tablets for this class."
            />
          ) : (
            <div className="space-y-3">
              {sharedTablets.slice(0, 5).map((tablet) => (
                <div
                  key={tablet.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{tablet.name}</p>
                    <p className="text-sm text-gray-500">@{tablet.username}</p>
                  </div>
                  {tablet.memo && <p className="text-xs text-gray-400">{tablet.memo}</p>}
                </div>
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

      {/* Delete Class Confirmation Modal */}
      <Modal
        open={isDeleteClassModalOpen}
        onClose={() => setIsDeleteClassModalOpen(false)}
        title="Delete Class"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{classData.name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass} isLoading={isDeletingClass}>
              Delete Class
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
