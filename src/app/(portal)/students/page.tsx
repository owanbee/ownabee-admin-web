"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { UserCircle, GraduationCap, Plus, Building2, Pencil } from "lucide-react";
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
import { formatDate, isApiError } from "@/lib/utils";
import { useIsInstitutionAdmin, useAuthStore } from "@/stores/authStore";
import type { Student, InstitutionClass, Institution } from "@/types";

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInstitutionAdmin = useIsInstitutionAdmin();
  const portalInfo = useAuthStore((state) => state.portalInfo);

  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [filterInstitutionId, setFilterInstitutionId] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    studentNumber: "",
    grade: "",
    memo: "",
    institutionId: "",
    classId: "",
  });

  // Get user's institutions where they are INSTITUTION_ADMIN
  const adminInstitutions = React.useMemo(() => {
    return (
      portalInfo?.institutionMemberships?.filter((role) => role.role === "INSTITUTION_ADMIN") ?? []
    );
  }, [portalInfo]);

  // Get all accessible institutions (both TEACHER and INSTITUTION_ADMIN)
  const accessibleInstitutions = React.useMemo(() => {
    return portalInfo?.institutionMemberships ?? [];
  }, [portalInfo]);

  // Check if user can create students (TEACHER or INSTITUTION_ADMIN)
  const canCreateStudent = accessibleInstitutions.length > 0;

  const handleInstitutionChange = (institutionId: string) => {
    setFilterInstitutionId(institutionId);
    setSelectedClassId(""); // Reset class filter when institution changes
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    router.push(`/students?${params.toString()}`);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const params = new URLSearchParams();
    if (filterInstitutionId) params.set("institutionId", filterInstitutionId);
    if (classId) params.set("classId", classId);
    router.push(`/students?${params.toString()}`);
  };

  const fetchStudents = React.useCallback(async () => {
    try {
      if (selectedClassId || filterInstitutionId) {
        const data = await api.getPortalStudents({
          institutionId: filterInstitutionId || "",
          institutionClassId: selectedClassId || "",
        });
        setStudents(data.students);
      } else {
        const data = await api.getMyStudents();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(isApiError(err) ? err.message : "Failed to load students");
    }
  }, [selectedClassId, filterInstitutionId]);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        username: student.username || "",
        password: "",
        institutionId: student.institution?.id || "",
        classId: student.institutionClass?.id || "",
        studentNumber: student.studentNumber || "",
        grade: student.grade || "",
        memo: student.memo || "",
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: "",
        username: "",
        password: "",
        studentNumber: "",
        grade: "",
        memo: "",
        institutionId: filterInstitutionId || "",
        classId: selectedClassId || "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      studentNumber: "",
      grade: "",
      memo: "",
      institutionId: "",
      classId: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingStudent) {
        await api.updatePortalStudent(editingStudent.id, {
          name: formData.name,
          ...(formData.studentNumber && { studentNumber: formData.studentNumber }),
          ...(formData.grade && { grade: formData.grade }),
          ...(formData.memo && { memo: formData.memo }),
          ...(formData.password && { password: formData.password }),
        });
      } else {
        await api.createPortalStudent({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          institutionId: formData.institutionId,
          institutionClassId: formData.classId,
          ...(formData.studentNumber && { studentNumber: formData.studentNumber }),
          ...(formData.grade && { grade: formData.grade }),
          ...(formData.memo && { memo: formData.memo }),
        });
      }
      handleCloseModal();
      await fetchStudents();
    } catch (err) {
      console.error("Failed to save student:", err);
      setError(isApiError(err) ? err.message : "Failed to save student");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Get URL params first
        const classIdParam = searchParams.get("classId");
        const institutionIdParam = searchParams.get("institutionId");
        if (classIdParam) setSelectedClassId(classIdParam);
        if (institutionIdParam) setFilterInstitutionId(institutionIdParam);

        // Fetch data
        const [classesData, institutionsData, studentsResult] = await Promise.all([
          api.getMyClasses(),
          api.getMyInstitutions(),
          classIdParam || institutionIdParam
            ? api.getPortalStudents({
                institutionId: institutionIdParam || "",
                institutionClassId: classIdParam || "",
              })
            : api.getMyStudents(),
        ]);

        setClasses(classesData);
        setInstitutions(institutionsData);
        setStudents(studentsResult.students);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(isApiError(err) ? err.message : "Failed to load data");
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

  // Reset class filter when institution changes and class doesn't belong to institution
  React.useEffect(() => {
    if (filterInstitutionId && selectedClassId) {
      const selectedClass = classes.find((cls) => cls.id === selectedClassId);
      if (selectedClass && selectedClass.institutionId !== filterInstitutionId) {
        setSelectedClassId("");
      }
    }
  }, [filterInstitutionId, selectedClassId, classes]);

  const availableClasses = React.useMemo(() => {
    if (!formData.institutionId) return [];
    return classes.filter((cls) => cls.institutionId === formData.institutionId);
  }, [formData.institutionId, classes]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading students..." />
      </DashboardLayout>
    );
  }

  // Filter classes and students by institution
  const filteredClasses = filterInstitutionId
    ? classes.filter((cls) => cls.institutionId === filterInstitutionId)
    : classes;

  const filteredStudents = filterInstitutionId
    ? students.filter((student) => student.institutionId === filterInstitutionId)
    : students;

  const institutionOptions = [
    { value: "", label: "All Institutions" },
    ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
  ];

  const classOptions =
    filterInstitutionId && filteredClasses.length === 0
      ? [{ value: "", label: "No classes available" }]
      : [
          { value: "", label: "All Classes" },
          ...filteredClasses.map((cls) => ({ value: cls.id, label: cls.name })),
        ];

  return (
    <DashboardLayout>
      <PageHeader
        title="My Students"
        description="View and manage students in your accessible classes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Students" }]}
        action={
          canCreateStudent ? (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          ) : undefined
        }
      />
      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Filters */}
      <div className="mb-6 flex gap-4 max-w-2xl">
        <div className="flex-1">
          <Select
            options={institutionOptions}
            value={filterInstitutionId}
            onChange={(e) => handleInstitutionChange(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Select
            options={classOptions}
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            disabled={!filterInstitutionId}
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="No students found"
          description={
            filterInstitutionId || selectedClassId
              ? "No students found for the selected filters."
              : "You don't have access to any students yet. Contact your administrator if you believe this is an error."
          }
          action={
            canCreateStudent ? (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      {student.username && (
                        <p className="text-sm text-gray-500">@{student.username}</p>
                      )}
                    </div>
                  </div>
                  {canCreateStudent && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(student)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  {student.institution && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span className="text-gray-500">{student.institution.name}</span>
                    </div>
                  )}
                  {student.institutionClass && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-gray-500">{student.institutionClass.name}</span>
                    </div>
                  )}
                </div>
                {student.studentNumber && (
                  <p className="mt-2 text-sm text-gray-600">Student #: {student.studentNumber}</p>
                )}
                {student.grade && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">{student.grade}</Badge>
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-400">
                  Created {formatDate(student.createdAt)}
                </p>
                <div className="mt-4">
                  <Link href={`/students/${student.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Student Modal */}
      {canCreateStudent && (
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          title={editingStudent ? "Edit Student" : "Create Student"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingStudent && (
              <>
                <Select
                  label="Institution"
                  options={[
                    { value: "", label: "Select Institution" },
                    ...accessibleInstitutions.map((inst) => ({
                      value: inst.institutionId,
                      label: inst.institutionName,
                    })),
                  ]}
                  value={formData.institutionId}
                  onChange={(e) => {
                    const institutionId = e.target.value;
                    const hasClasses = classes.some((cls) => cls.institutionId === institutionId);
                    setFormData((prev) => ({
                      ...prev,
                      institutionId: hasClasses ? institutionId : "",
                      institutionClassId: "",
                    }));
                  }}
                  required
                />
                <Select
                  label="Class"
                  options={
                    formData.institutionId &&
                    classes.filter((cls) => cls.institutionId === formData.institutionId).length ===
                      0
                      ? [{ value: "", label: "No classes available" }]
                      : [
                          { value: "", label: "Select Class" },
                          ...classes
                            .filter(
                              (cls) =>
                                !formData.institutionId ||
                                cls.institutionId === formData.institutionId
                            )
                            .map((cls) => ({
                              value: cls.id,
                              label: cls.name,
                            })),
                        ]
                  }
                  value={formData.classId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, classId: e.target.value }))}
                  required
                  disabled={!formData.institutionId}
                />
                <Input
                  label="ID"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter ID (required)"
                  required
                />
              </>
            )}
            <Input
              label={editingStudent ? "New Password (Optional)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={
                editingStudent
                  ? "Leave blank to keep current password"
                  : "Enter password (required)"
              }
              required={!editingStudent}
            />
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter student name (required)"
              required
            />
            <Input
              label="Student Number"
              value={formData.studentNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, studentNumber: e.target.value }))}
              placeholder="Enter student number (optional)"
            />
            <Input
              label="Grade"
              value={formData.grade}
              onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
              placeholder="Enter grade (optional)"
            />
            <Input
              label="Memo"
              value={formData.memo}
              onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="Enter memo (optional)"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingStudent ? "Update" : "Create"}
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
