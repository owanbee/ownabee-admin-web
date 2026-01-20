"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { School, Plus, Trash2, Tablet, Users, Key, ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { InstitutionClass, SharedTabletAccount } from "@/types";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = React.useState<InstitutionClass | null>(null);
  const [sharedTablets, setSharedTablets] = React.useState<SharedTabletAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    loginId: "",
    pinCode: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<SharedTabletAccount | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [classInfo, tablets] = await Promise.all([
        api.getClass(classId),
        api.getClassSharedTablets(classId),
      ]);
      setClassData(classInfo);
      setSharedTablets(tablets);
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

  const handleOpenModal = () => {
    setFormData({ name: "", loginId: "", pinCode: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", loginId: "", pinCode: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: { name: string; loginId: string; pinCode?: string } = {
        name: formData.name,
        loginId: formData.loginId,
      };
      if (formData.pinCode) {
        payload.pinCode = formData.pinCode;
      }
      const created = await api.createClassSharedTablet(classId, payload);
      setSharedTablets((prev) => [created, ...prev]);
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to create shared tablet:", err);
      setError(err.message || "Failed to create shared tablet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await api.deleteSharedTablet(deleteTarget.id);
      setSharedTablets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Failed to delete shared tablet:", err);
      setError(err.message || "Failed to delete shared tablet");
    } finally {
      setIsDeleting(false);
    }
  };

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
          icon={School}
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
        description={classData.description || `Manage shared tablets for ${classData.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Classes", href: "/admin/classes" },
          { label: classData.name },
        ]}
        action={
          <Button variant="outline" onClick={() => router.push("/admin/classes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-800 underline"
          >
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
                <Users className="mr-1 h-3 w-3" />
                {classData._count?.students || 0} students
              </Badge>
              <Badge variant="secondary">
                <Tablet className="mr-1 h-3 w-3" />
                {sharedTablets.length} tablets
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Tablets Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            Shared Tablets
          </CardTitle>
          <Button onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tablet
          </Button>
        </CardHeader>
        <CardContent>
          {sharedTablets.length === 0 ? (
            <EmptyState
              icon={Tablet}
              title="No shared tablets"
              description="Add shared tablets for students to use in this class."
              action={
                <Button onClick={handleOpenModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tablet
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sharedTablets.map((tablet) => (
                <div
                  key={tablet.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <Tablet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{tablet.name}</h4>
                      <p className="text-sm text-gray-500">
                        Login ID: <code className="rounded bg-gray-100 px-1">{tablet.loginId}</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tablet.hasPinCode && (
                      <Badge variant="secondary">
                        <Key className="mr-1 h-3 w-3" />
                        PIN Set
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {(tablet.profile as any)?._count?.portfolios || 0} portfolios
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(tablet)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tablet Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Add Shared Tablet"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tablet Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g., Tablet 1, 성민1"
            required
          />
          <Input
            label="Login ID"
            value={formData.loginId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, loginId: e.target.value }))
            }
            placeholder="e.g., tablet001"
            required
          />
          <Input
            label="PIN Code (4-6 digits)"
            type="password"
            value={formData.pinCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, pinCode: e.target.value }))
            }
            placeholder="Optional"
            maxLength={6}
          />
          <p className="text-sm text-gray-500">
            Students will use the Login ID and PIN to access this tablet account.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Tablet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Shared Tablet"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
