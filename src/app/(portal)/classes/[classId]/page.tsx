"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  Tablet,
  ArrowLeft,
  UserCircle,
  UserCheck,
  Building2,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { useIsInstitutionAdmin } from "@/stores/authStore";
import type {
  InstitutionClass,
  SharedTablet,
  Student,
  ClassTeacher,
  UserSearchResult,
} from "@/types";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const isInstitutionAdmin = useIsInstitutionAdmin();

  const [classData, setClassData] = React.useState<InstitutionClass | null>(null);
  const [sharedTablets, setSharedTablets] = React.useState<SharedTablet[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<ClassTeacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Teacher assignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [teacherEmail, setTeacherEmail] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Teacher removal modal state
  const [teacherToRemove, setTeacherToRemove] = React.useState<ClassTeacher | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const classInfo = await api.getPortalClass(classId);
      setClassData(classInfo);

      // Fetch related data for this class
      const [tabletsData, studentsData, teachersData] = await Promise.all([
        api.getPortalSharedTablets({ institutionId: classInfo.institutionId, classId }),
        api.getPortalStudents({ institutionId: classInfo.institutionId, classId }),
        api.getPortalClassTeachers(classId),
      ]);
      setSharedTablets(tabletsData?.tablets ?? []);
      setStudents(studentsData?.students ?? []);
      setTeachers(teachersData ?? []);
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

  const handleSearchTeacher = async () => {
    if (!teacherEmail) return;

    setIsSearching(true);
    try {
      const results = await api.searchPortalUser(teacherEmail);
      setSearchResults(results);
    } catch (err) {
      console.error("Failed to search user:", err);
      setError(err instanceof Error ? err.message : "Failed to search user");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignTeacher = async (userId: string) => {
    setIsAssigning(true);
    setError(null);

    try {
      await api.assignPortalTeacher(classId, { teacherUserId: userId });
      setIsAssignModalOpen(false);
      setTeacherEmail("");
      setSearchResults([]);
      await fetchData();
    } catch (err) {
      console.error("Failed to assign teacher:", err);
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveTeacher = async () => {
    if (!teacherToRemove) return;

    setIsRemoving(true);
    setError(null);

    try {
      await api.removePortalTeacher(classId, teacherToRemove.userId);
      setTeacherToRemove(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to remove teacher:", err);
      setError(err instanceof Error ? err.message : "Failed to remove teacher");
    } finally {
      setIsRemoving(false);
    }
  };

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
          icon={GraduationCap}
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
                {students?.length ?? 0} students
              </Badge>
              <Badge variant="secondary">
                <Tablet className="mr-1 h-3 w-3" />
                {sharedTablets?.length ?? 0} tablets
              </Badge>
              <Badge variant="secondary">
                <UserCheck className="mr-1 h-3 w-3" />
                {teachers?.length ?? 0} teachers
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
              href={`/students?institutionId=${classData.institutionId}&classId=${classId}`}
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
                  <Link key={student.id} href={`/students/${student.id}`} className="block">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Teachers
            </CardTitle>
            {isInstitutionAdmin && (
              <Link href={`/members?institutionId=${classData.institutionId}`}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Teachers
                </Button>
              </Link>
            )}
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
                    <Avatar
                      src={teacher.user.picture ?? null}
                      name={teacher.user.name ?? teacher.user.email}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {teacher.user.name || teacher.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{teacher.user.email}</p>
                    </div>
                    {isInstitutionAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTeacherToRemove(teacher)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
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
            href={`/shared-tablets?institutionId=${classData.institutionId}&classId=${classId}`}
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
              description="This class doesn't have any shared tablets yet."
            />
          ) : (
            <div className="space-y-3">
              {sharedTablets.slice(0, 5).map((tablet) => (
                <Link key={tablet.id} href={`/shared-tablets/${tablet.id}`} className="block">
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

      {/* Assign Teacher Modal */}
      {isInstitutionAdmin && (
        <Modal
          open={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setTeacherEmail("");
            setSearchResults([]);
          }}
          title="Assign Teacher"
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                label="Teacher Email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="Enter email to search"
              />
              <Button onClick={handleSearchTeacher} isLoading={isSearching} className="mt-7">
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Search Results:</p>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.picture ?? null} name={user.name ?? user.email} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{user.name || user.email}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignTeacher(user.id)}
                      isLoading={isAssigning}
                    >
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Remove Teacher Confirmation Modal */}
      {teacherToRemove && (
        <Modal
          open={!!teacherToRemove}
          onClose={() => setTeacherToRemove(null)}
          title="Remove Teacher"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove{" "}
              <strong>{teacherToRemove.user.name || teacherToRemove.user.email}</strong> from this
              class?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTeacherToRemove(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveTeacher} isLoading={isRemoving}>
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
