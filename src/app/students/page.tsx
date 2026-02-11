"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { UserCircle, GraduationCap, FolderOpen, Building2, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useIsInstitutionAdmin, useAuthStore } from "@/stores/authStore";
import type { Student, InstitutionClass } from "@/types";

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInstitutionAdmin = useIsInstitutionAdmin();
  const portalInfo = useAuthStore((state) => state.portalInfo);

  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Create student modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createFormData, setCreateFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    studentNumber: "",
    grade: "",
    memo: "",
    institutionId: "",
    institutionClassId: "",
  });

  // Get user's institutions where they are INSTITUTION_ADMIN
  const adminInstitutions = React.useMemo(() => {
    return (
      portalInfo?.institutionMemberships?.filter((role) => role.role === "INSTITUTION_ADMIN") ?? []
    );
  }, [portalInfo]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    router.push(`/students?${params.toString()}`);
  };

  const fetchStudents = React.useCallback(async () => {
    try {
      if (selectedClassId) {
        const data = await api.getPortalStudents({ classId: selectedClassId });
        setStudents(data.students);
      } else {
        const data = await api.getMyStudents();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(err instanceof Error ? err.message : "Failed to load students");
    }
  }, [selectedClassId]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      await api.createPortalStudent({
        name: createFormData.name,
        username: createFormData.username,
        password: createFormData.password,
        institutionId: createFormData.institutionId,
        institutionClassId: createFormData.institutionClassId,
        ...(createFormData.studentNumber && { studentNumber: createFormData.studentNumber }),
        ...(createFormData.grade && { grade: createFormData.grade }),
        ...(createFormData.memo && { memo: createFormData.memo }),
      });
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: "",
        username: "",
        password: "",
        studentNumber: "",
        grade: "",
        memo: "",
        institutionId: "",
        institutionClassId: "",
      });
      await fetchStudents();
    } catch (err) {
      console.error("Failed to create student:", err);
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setIsCreating(false);
    }
  };

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
          const result = await api.getPortalStudents({ classId: classIdParam });
          setStudents(result.students);
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

  // Set default institutionId and classId when modal opens
  React.useEffect(() => {
    if (isCreateModalOpen && adminInstitutions.length > 0) {
      const firstInstitution = adminInstitutions[0];
      const firstClass = classes.find(
        (cls) => cls.institutionId === firstInstitution?.institutionId
      );
      setCreateFormData({
        name: "",
        username: "",
        password: "",
        studentNumber: "",
        grade: "",
        memo: "",
        institutionId: firstInstitution?.institutionId ?? "",
        institutionClassId: firstClass?.id ?? "",
      });
    }
  }, [isCreateModalOpen, adminInstitutions, classes]);

  // Refetch students when class filter changes manually
  React.useEffect(() => {
    if (!isLoading) {
      fetchStudents();
    }
  }, [fetchStudents, isLoading]);

  const availableClasses = React.useMemo(() => {
    if (!createFormData.institutionId) return [];
    return classes.filter((cls) => cls.institutionId === createFormData.institutionId);
  }, [createFormData.institutionId, classes]);

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
        action={
          isInstitutionAdmin ? (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          ) : undefined
        }
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
          action={
            isInstitutionAdmin ? (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <UserCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        {student.institutionClass && (
                          <p className="text-sm text-gray-500">
                            {student.institutionClass.institution.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {student.studentNumber && (
                    <p className="mt-2 text-sm text-gray-600">#{student.studentNumber}</p>
                  )}
                  {student.grade && (
                    <Badge variant="secondary" className="mt-2">
                      {student.grade}
                    </Badge>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    Created {formatDate(student.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Student Modal */}
      {isInstitutionAdmin && (
        <Modal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Student"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4">
            {adminInstitutions.length > 1 && (
              <Select
                label="Institution"
                options={adminInstitutions.map((inst) => ({
                  value: inst.institutionId,
                  label: inst.institutionName,
                }))}
                value={createFormData.institutionId}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    institutionId: e.target.value,
                    institutionClassId: "",
                  }))
                }
                required
              />
            )}
            <Select
              label="Class"
              options={availableClasses.map((cls) => ({
                value: cls.id,
                label: cls.name,
              }))}
              value={createFormData.institutionClassId}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, institutionClassId: e.target.value }))
              }
              required
            />
            <Input
              label="Name"
              value={createFormData.name}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter student name"
              required
            />
            <Input
              label="Username"
              value={createFormData.username}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username for login"
              required
            />
            <Input
              label="Password"
              type="password"
              value={createFormData.password}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
              required
            />
            <Input
              label="Student Number (Optional)"
              value={createFormData.studentNumber}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, studentNumber: e.target.value }))
              }
              placeholder="Enter student number"
            />
            <Input
              label="Grade (Optional)"
              value={createFormData.grade}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, grade: e.target.value }))}
              placeholder="e.g., Grade 5"
            />
            <Input
              label="Memo (Optional)"
              value={createFormData.memo}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="Enter memo"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isCreating}>
                Create
              </Button>
            </div>
          </form>
        </Modal>
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
