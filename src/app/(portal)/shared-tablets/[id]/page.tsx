"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Tablet,
  Calendar,
  Building2,
  FileText,
  GraduationCap,
  Pencil,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { SharedTablet } from "@/types";

export default function SharedTabletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tabletId = params.id as string;
  const portalInfo = useAuthStore((state) => state.portalInfo);

  const [tablet, setTablet] = React.useState<SharedTablet | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    memo: "",
    password: "",
  });

  // Check if user can edit (has access to this tablet's institution)
  const canEdit = React.useMemo(() => {
    if (!tablet || !portalInfo?.institutionMemberships) return false;
    return portalInfo.institutionMemberships.some(
      (membership) => membership.institutionId === tablet.institutionId
    );
  }, [tablet, portalInfo]);

  const fetchTablet = React.useCallback(async () => {
    try {
      const data = await api.getPortalSharedTablet(tabletId);
      setTablet(data);
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
      setEditFormData({
        name: tablet.name,
        memo: tablet.memo || "",
        password: "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateTablet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      await api.updatePortalSharedTablet(tabletId, {
        name: editFormData.name,
        ...(editFormData.memo && { memo: editFormData.memo }),
        ...(editFormData.password && { password: editFormData.password }),
      });
      setIsEditModalOpen(false);
      await fetchTablet();
    } catch (err) {
      console.error("Failed to update tablet:", err);
      setError(err instanceof Error ? err.message : "Failed to update tablet");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading tablet details..." />
      </DashboardLayout>
    );
  }

  if (!tablet) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Tablet className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tablet not found</h2>
          <p className="text-gray-500 mb-6">The shared tablet you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/shared-tablets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shared Tablets
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={tablet.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Shared Tablets", href: "/shared-tablets" },
          { label: tablet.name },
        ]}
        action={
          <div className="flex gap-2">
            {canEdit && (
              <Button onClick={handleOpenEditModal}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/shared-tablets")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
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
                    {tablet.institution && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">Institution:</span>
                        </div>
                        <span className="text-sm text-gray-900">{tablet.institution.name}</span>
                      </div>
                    )}

                    {tablet.institutionClass && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <GraduationCap className="h-4 w-4" />
                          <span className="font-medium">Class:</span>
                        </div>
                        <span className="text-sm text-gray-900">
                          {tablet.institutionClass.name}
                        </span>
                      </div>
                    )}

                    {tablet.memo && (
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Memo:</span>
                        </div>
                        <span className="text-sm text-gray-900 whitespace-pre-wrap">
                          {tablet.memo}
                        </span>
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
                        <span className="text-sm text-gray-900">
                          {formatDate(tablet.updatedAt)}
                        </span>
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
      {canEdit && (
        <Modal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Shared Tablet"
        >
          <form onSubmit={handleUpdateTablet} className="space-y-4">
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
              placeholder="Enter tablet name (required)"
              required
            />
            <Input
              label="Memo"
              value={editFormData.memo}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="Enter memo (optional)"
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
