"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { GraduationCap, Plus, Pencil, Building2, Users, User } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Student, CreateStudentPayload, InstitutionClass, Institution } from "@/types";

function AdminStudentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filterInstitutionId, setFilterInstitutionId] = useState("");
  const [filterClassId, setFilterClassId] = useState("");

  // Update query string when filters change
  const handleInstitutionFilterChange = (institutionId: string) => {
    setFilterInstitutionId(institutionId);
    setFilterClassId(""); // Reset class filter

    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    router.push(`/admin/students?${params.toString()}`);
  };

  const handleClassFilterChange = (classId: string) => {
    setFilterClassId(classId);

    const params = new URLSearchParams();
    if (filterInstitutionId) params.set("institutionId", filterInstitutionId);
    if (classId) params.set("classId", classId);
    router.push(`/admin/students?${params.toString()}`);
  };

  // Fetch students function (reusable)
  const fetchStudents = useCallback(async () => {
    try {
      const params: { institutionId?: string; institutionClassId?: string } = {};
      if (filterInstitutionId) params.institutionId = filterInstitutionId;
      if (filterClassId) params.institutionClassId = filterClassId;

      const studentsData = await api.getStudents(params);
      setStudents(studentsData.students);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError(err instanceof Error ? err.message : "Failed to load students");
    }
  }, [filterInstitutionId, filterClassId]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    institutionId: "",
    institutionClassId: "",
    studentNumber: "",
    grade: "",
    memo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get URL params first
        const institutionIdParam = searchParams.get("institutionId");
        const classIdParam = searchParams.get("classId");

        // Set filters from URL params
        if (institutionIdParam) setFilterInstitutionId(institutionIdParam);
        if (classIdParam) setFilterClassId(classIdParam);

        // Fetch institutions and classes
        const [institutionsData, institutionClassesData] = await Promise.all([
          api.getInstitutions(),
          api.getClasses(),
        ]);
        setInstitutions(institutionsData);
        setClasses(institutionClassesData);

        // Fetch students with URL params
        const params: { institutionId?: string; institutionClassId?: string } = {};
        if (institutionIdParam) params.institutionId = institutionIdParam;
        if (classIdParam) params.institutionClassId = classIdParam;

        const studentsData = await api.getStudents(params);
        setStudents(studentsData.students);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Refetch students when filters change manually
  useEffect(() => {
    // Only fetch if not initial load
    if (!isLoading) {
      fetchStudents();
    }
  }, [fetchStudents, isLoading]);

  // Reset class filter when institution changes
  useEffect(() => {
    if (filterInstitutionId && filterClassId) {
      const selectedClass = classes.find((cls) => cls.id === filterClassId);
      if (selectedClass && selectedClass.institutionId !== filterInstitutionId) {
        setFilterClassId("");
      }
    }
  }, [filterInstitutionId, filterClassId, classes]);

  const handleOpenModal = (std?: Student) => {
    if (std) {
      setEditingStudent(std);
      setFormData({
        name: std.name,
        username: std.username || "",
        password: "",
        institutionId: std.institution?.id || "",
        institutionClassId: std.institutionClass?.id || "",
        studentNumber: std.studentNumber || "",
        grade: std.grade || "",
        memo: std.memo || "",
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: "",
        username: "",
        password: "",
        institutionId: filterInstitutionId || "",
        institutionClassId: filterClassId || "",
        studentNumber: "",
        grade: "",
        memo: "",
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
      institutionId: "",
      institutionClassId: "",
      studentNumber: "",
      grade: "",
      memo: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          name: formData.name,
          ...(formData.studentNumber && { studentNumber: formData.studentNumber }),
          ...(formData.grade && { grade: formData.grade }),
          ...(formData.memo && { memo: formData.memo }),
          ...(formData.password && { password: formData.password }),
        });
      } else {
        await api.createStudent({
          institutionId: formData.institutionId,
          institutionClassId: formData.institutionClassId,
          username: formData.username,
          password: formData.password,
          name: formData.name,
          ...(formData.studentNumber && { studentNumber: formData.studentNumber }),
          ...(formData.grade && { grade: formData.grade }),
          ...(formData.memo && { memo: formData.memo }),
        });
      }
      handleCloseModal();
      fetchStudents();
    } catch (err) {
      console.error("Failed to save student:", err);
      setError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading students..." />
      </AdminLayout>
    );
  }

  const institutionOptions = [
    { value: "", label: "All Institutions" },
    ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
  ];

  const filteredClasses = filterInstitutionId
    ? classes.filter((cls) => cls.institutionId === filterInstitutionId)
    : classes;

  const classOptions =
    filterInstitutionId && filteredClasses.length === 0
      ? [{ value: "", label: "No classes available" }]
      : [
          { value: "", label: "All Classes" },
          ...filteredClasses.map((cls) => ({ value: cls.id, label: cls.name })),
        ];

  return (
    <AdminLayout>
      <PageHeader
        title="Manage Students"
        description="Create and manage students across all institutions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Students" },
        ]}
        action={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Filter */}
      <div className="mb-6 flex gap-4 max-w-xl">
        <Select
          options={institutionOptions}
          value={filterInstitutionId}
          onChange={(e) => handleInstitutionFilterChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          options={classOptions}
          value={filterClassId}
          onChange={(e) => handleClassFilterChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students yet"
          description={
            filterInstitutionId
              ? "No students found for this institution."
              : "Create your first student to get started."
          }
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((std) => (
            <Card key={std.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{std.name}</h3>
                      {std.username && <p className="text-sm text-gray-500">@{std.username}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(std)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {std.institution && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{std.institution.name}</span>
                    </div>
                  )}
                  {std.institutionClass && (
                    <div className="flex items-center gap-2 mt-1">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-gray-500">{std.institutionClass.name}</span>
                    </div>
                  )}
                </div>
                {std.studentNumber && (
                  <p className="mt-2 text-sm text-gray-600">Student #: {std.studentNumber}</p>
                )}
                {std.grade && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">{std.grade}</Badge>
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-400">Created {formatDate(std.createdAt)}</p>
                <div className="mt-4">
                  <Link href={`/admin/students/${std.id}`}>
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

      {/* Create/Edit Modal */}
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
                  ...institutions.map((inst) => ({
                    value: inst.id,
                    label: inst.name,
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
                  classes.filter((cls) => cls.institutionId === formData.institutionId).length === 0
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
                value={formData.institutionClassId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, institutionClassId: e.target.value }))
                }
                required
                // disabled={!formData.institutionId}
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
              editingStudent ? "Leave blank to keep current password" : "Enter password (required)"
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
    </AdminLayout>
  );
}

export default function AdminStudentsPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <LoadingPage message="Loading students..." />
        </AdminLayout>
      }
    >
      <AdminStudentsPageContent />
    </Suspense>
  );
}
