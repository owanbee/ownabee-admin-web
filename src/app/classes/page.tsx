"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, Users, Plus, UserCircle, Tablet, UserCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useIsInstitutionAdmin, useAuthStore } from "@/stores/authStore";
import type { InstitutionClass } from "@/types";

export default function ClassesPage() {
  const isInstitutionAdmin = useIsInstitutionAdmin();
  const portalInfo = useAuthStore((state) => state.portalInfo);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Get user's institutions where they are INSTITUTION_ADMIN
  const adminInstitutions = React.useMemo(() => {
    return (
      portalInfo?.institutionMemberships?.filter((role) => role.role === "INSTITUTION_ADMIN") ?? []
    );
  }, [portalInfo]);

  // Create class modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createFormData, setCreateFormData] = React.useState({
    name: "",
    memo: "",
    institutionId: "",
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isCreateModalOpen) {
      setCreateFormData({
        name: "",
        memo: "",
        institutionId: adminInstitutions[0]?.institutionId ?? "",
      });
    }
  }, [isCreateModalOpen, adminInstitutions]);

  const fetchClasses = React.useCallback(async () => {
    try {
      const data = await api.getMyClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setError(err instanceof Error ? err.message : "Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.institutionId) {
      setError("Please select an institution");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await api.createPortalClass({
        name: createFormData.name,
        memo: createFormData.memo,
        institutionId: createFormData.institutionId,
      });
      setIsCreateModalOpen(false);
      setCreateFormData({ name: "", memo: "", institutionId: "" });
      await fetchClasses();
    } catch (err) {
      console.error("Failed to create class:", err);
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading classes..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Classes"
        description="View and manage students in your accessible classes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Classes" }]}
        action={
          isInstitutionAdmin ? (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          ) : undefined
        }
      />
      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes found"
          description="You don't have access to any classes yet. Contact your administrator if you believe this is an error."
          action={
            isInstitutionAdmin ? (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      {cls.institution && (
                        <p className="text-sm text-gray-500">{cls.institution.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {cls.memo && <p className="mt-3 text-sm text-gray-600 line-clamp-2">{cls.memo}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <UserCircle className="mr-1 h-3 w-3" />
                    {cls._count?.students || 0} students
                  </Badge>
                  <Badge variant="secondary">
                    <Tablet className="mr-1 h-3 w-3" />
                    {cls._count?.sharedTablets || 0} tablets
                  </Badge>
                  <Badge variant="secondary">
                    <UserCheck className="mr-1 h-3 w-3" />
                    {cls._count?.teachers || 0} teachers
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-gray-400">Created {formatDate(cls.createdAt)}</p>

                <div className="mt-4">
                  <Link href={`/classes/${cls.id}`}>
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

      {/* Create Class Modal */}
      {isInstitutionAdmin && (
        <Modal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Class"
        >
          <form onSubmit={handleCreateClass} className="space-y-4">
            {adminInstitutions.length > 0 && (
              <Select
                label="Institution"
                options={adminInstitutions.map((inst) => ({
                  value: inst.institutionId,
                  label: inst.institutionName,
                }))}
                value={createFormData.institutionId}
                onChange={(e) =>
                  setCreateFormData((prev) => ({ ...prev, institutionId: e.target.value }))
                }
                disabled={adminInstitutions.length === 1}
                required
              />
            )}
            <Input
              label="Class Name"
              value={createFormData.name}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter class name"
              required
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
