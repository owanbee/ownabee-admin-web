"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Calendar,
  Hash,
  BookOpen,
  FileText,
  Pencil,
  Building2,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate, isApiError } from "@/lib/utils";
import { useIsInstitutionAdmin } from "@/stores/authStore";
import type { Student } from "@/types";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const isInstitutionAdmin = useIsInstitutionAdmin();

  const [student, setStudent] = React.useState<Student | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    studentNumber: "",
    grade: "",
    memo: "",
    password: "",
  });

  const fetchStudent = React.useCallback(async () => {
    try {
      const data = await api.getPortalStudent(studentId);
      setStudent(data);
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
      setEditFormData({
        name: student.name,
        studentNumber: student.studentNumber || "",
        grade: student.grade || "",
        memo: student.memo || "",
        password: "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      await api.updatePortalStudent(studentId, {
        name: editFormData.name,
        ...(editFormData.studentNumber && { studentNumber: editFormData.studentNumber }),
        ...(editFormData.grade && { grade: editFormData.grade }),
        ...(editFormData.memo && { memo: editFormData.memo }),
        ...(editFormData.password && { password: editFormData.password }),
      });
      setIsEditModalOpen(false);
      await fetchStudent();
    } catch (err) {
      console.error("Failed to update student:", err);
      setError(isApiError(err) ? err.message : "Failed to update student");
    } finally {
      setIsUpdating(false);
    }
  };

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
          <div className="flex gap-2">
            {isInstitutionAdmin && (
              <Button onClick={handleOpenEditModal}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/students")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info Card */}
        <div className="lg:col-span-2 space-y-6">
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
                    {student.institution && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">Institution:</span>
                        </div>
                        <span className="text-sm text-gray-900">{student.institution.name}</span>
                      </div>
                    )}

                    {student.institutionClass && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <GraduationCap className="h-4 w-4" />
                          <span className="font-medium">Class:</span>
                        </div>
                        <span className="text-sm text-gray-900">
                          {student.institutionClass.name}
                        </span>
                      </div>
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

          {/* Portfolios Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Portfolios</h3>
                </div>
                <Link href={`/students/${studentId}/portfolios`}>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Portfolios
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                View and manage portfolios for this student
              </p>
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

      {/* Edit Student Modal */}
      {isInstitutionAdmin && (
        <Modal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Student"
        >
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <Input
              label="New Password (Optional)"
              type="password"
              value={editFormData.password}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Leave blank to keep current password"
            />
            <Input
              label="Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter student name"
              required
            />
            <Input
              label="Student Number (Optional)"
              value={editFormData.studentNumber}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, studentNumber: e.target.value }))
              }
              placeholder="Enter student number"
            />
            <Input
              label="Grade (Optional)"
              value={editFormData.grade}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, grade: e.target.value }))}
              placeholder="e.g., Grade 5"
            />
            <Input
              label="Memo (Optional)"
              value={editFormData.memo}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="Enter memo"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isUpdating}>
                Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
