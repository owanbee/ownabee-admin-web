"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tablet, Calendar, Pencil, Trash2, Building2, Hash } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SharedTablet, UpdateSharedTabletPayload } from "@/types";

export default function SharedTabletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tabletId = params.id as string;

  const [tablet, setTablet] = React.useState<SharedTablet | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    memo: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchTablet = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getSharedTablet(tabletId);
      setTablet(data);
      setFormData({
        name: data.name,
        memo: data.memo || "",
        password: "",
      });
    } catch (err) {
      console.error("Failed to fetch tablet:", err);
      setError(err instanceof Error ? err.message : "Failed to load tablet");
    } finally {
      setIsLoading(false);
    }
  }, [tabletId]);

  React.useEffect(() => {
    fetchTablet();
  }, [fetchTablet]);

  const handleOpenEditModal = () => {
    if (tablet) {
      setFormData({
        name: tablet.name,
        memo: tablet.memo || "",
        password: "",
      });
    }
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setFormData({ name: "", memo: "", password: "" });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.updateSharedTablet(tabletId, {
        name: formData.name,
        ...(formData.memo && { memo: formData.memo }),
        ...(formData.password && { password: formData.password }),
      });
      handleCloseEditModal();
      fetchTablet();
    } catch (err) {
      console.error("Failed to update tablet:", err);
      setError(err instanceof Error ? err.message : "Failed to update tablet");
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
      await api.deleteSharedTablet(tabletId);
      handleCloseDeleteModal();
      router.push("/admin/shared-tablets");
    } catch (err) {
      console.error("Failed to delete tablet:", err);
      setError(err instanceof Error ? err.message : "Failed to delete tablet");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading tablet details..." />
      </AdminLayout>
    );
  }

  if (!tablet) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Tablet className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tablet not found</h2>
          <p className="text-gray-500 mb-6">The shared tablet you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/admin/shared-tablets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shared Tablets
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={tablet.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Shared Tablets", href: "/admin/shared-tablets" },
          { label: tablet.name },
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
                <div className="rounded-full bg-purple-100 p-4">
                  <Tablet className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">{tablet.name}</h2>
                  {tablet.username && (
                    <p className="text-sm text-gray-500 mb-4">@{tablet.username}</p>
                  )}

                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Institution:</span>
                      </div>
                      <span className="text-sm text-gray-900">
                        {tablet.institutionName || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">Class:</span>
                      </div>
                      <span className="text-sm text-gray-900">
                        {tablet.institutionClassName || "N/A"}
                      </span>
                    </div>

                    {tablet.memo && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <span className="font-medium">Memo:</span>
                        </div>
                        <span className="text-sm text-gray-900 whitespace-pre-wrap">{tablet.memo}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created:</span>
                      </div>
                      <span className="text-sm text-gray-900">{formatDate(tablet.createdAt)}</span>
                    </div>

                    {tablet.updatedAt && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Updated:</span>
                        </div>
                        <span className="text-sm text-gray-900">{formatDate(tablet.updatedAt)}</span>
                      </div>
                    )}
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
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tablet.userId}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tablet ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tablet.id}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Shared Tablet"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter tablet name"
            required
          />
          <Input
            label="Memo"
            value={formData.memo}
            onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
            placeholder="Enter memo (optional)"
          />
          <Input
            label="New Password (Optional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Leave blank to keep current password"
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
      <Modal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Delete Shared Tablet"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{tablet.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseDeleteModal}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Tablet
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
