"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Calendar,
  Pencil,
  Trash2,
  Building2,
  Hash,
  BookOpen,
  FileText,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate, isApiError } from "@/lib/utils";
import type { Student, UpdateStudentPayload } from "@/types";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [student, setStudent] = React.useState<Student | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    studentNumber: "",
    grade: "",
    memo: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchStudent = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getStudent(studentId);
      setStudent(data);
      setFormData({
        name: data.name,
        studentNumber: data.studentNumber || "",
        grade: data.grade || "",
        memo: data.memo || "",
        password: "",
      });
    } catch (err) {
      console.error("Failed to fetch student:", err);
      setError(isApiError(err) ? err.message : "Failed to load student");
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const handleOpenEditModal = () => {
    if (student) {
      setFormData({
        name: student.name,
        studentNumber: student.studentNumber || "",
        grade: student.grade || "",
        memo: student.memo || "",
        password: "",
      });
    }
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setFormData({ name: "", studentNumber: "", grade: "", memo: "", password: "" });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.updateStudent(studentId, {
        name: formData.name,
        ...(formData.studentNumber && { studentNumber: formData.studentNumber }),
        ...(formData.grade && { grade: formData.grade }),
        ...(formData.memo && { memo: formData.memo }),
        ...(formData.password && { password: formData.password }),
      });
      handleCloseEditModal();
      fetchStudent();
    } catch (err) {
      console.error("Failed to update student:", err);
      setError(isApiError(err) ? err.message : "Failed to update student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteStudent(studentId);
      handleCloseDeleteModal();
      router.push("/admin/students");
    } catch (err) {
      console.error("Failed to delete student:", err);
      setError(isApiError(err) ? err.message : "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading student details..." />
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student not found</h2>
          <p className="text-gray-500 mb-6">The student you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={student.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Students", href: "/admin/students" },
          { label: student.name },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenEditModal}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleOpenDeleteModal}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
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
                            {student.institution?.name || ""}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                            <GraduationCap className="h-4 w-4" />
                            <span className="font-medium">Class:</span>
                          </div>
                          <span className="text-sm text-gray-900">
                            {student.institutionClass?.name || ""}
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
                        <span className="text-sm text-gray-900 whitespace-pre-wrap">
                          {student.memo}
                        </span>
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
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{student.userId}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Student ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{student.id}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Student">
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <Input
            label="New Password (Optional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Leave blank to keep current password"
          />
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter student name"
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
            <Button type="button" variant="outline" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Student">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{student.name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseDeleteModal}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
              Delete Student
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
