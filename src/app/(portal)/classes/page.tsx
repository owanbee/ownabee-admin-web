"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GraduationCap, Users, Plus, UserCircle, Tablet, UserCheck, Pencil } from "lucide-react";
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
import { formatDate, isApiError } from "@/lib/utils";
import { useIsInstitutionAdmin, useAuthStore } from "@/stores/authStore";
import type { InstitutionClass, Institution } from "@/types";

function ClassesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isInstitutionAdmin = useIsInstitutionAdmin();
  const portalInfo = useAuthStore((state) => state.portalInfo);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [filterInstitutionId, setFilterInstitutionId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Get user's institutions where they are INSTITUTION_ADMIN
  const adminInstitutions = React.useMemo(() => {
    return (
      portalInfo?.institutionMemberships?.filter((role) => role.role === "INSTITUTION_ADMIN") ?? []
    );
  }, [portalInfo]);

  // Initialize from URL params on mount
  React.useEffect(() => {
    const institutionId = searchParams.get("institutionId");
    if (institutionId) {
      setFilterInstitutionId(institutionId);
    }
  }, [searchParams]);

  const handleInstitutionFilterChange = (institutionId: string) => {
    setFilterInstitutionId(institutionId);
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    router.push(`/classes?${params.toString()}`);
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<InstitutionClass | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    memo: "",
    institutionId: "",
  });

  const handleOpenModal = (cls?: InstitutionClass) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name,
        memo: cls.memo || "",
        institutionId: cls.institutionId,
      });
    } else {
      setEditingClass(null);
      // If user has only one institution, pre-select it; otherwise leave empty for user to select
      const defaultInstitutionId = adminInstitutions.length === 1
        ? (adminInstitutions[0]?.institutionId ?? "")
        : "";

      setFormData({
        name: "",
        memo: "",
        institutionId: defaultInstitutionId,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setFormData({ name: "", memo: "", institutionId: "" });
  };

  const fetchData = React.useCallback(async () => {
    try {
      const [classesData, institutionsData] = await Promise.all([
        api.getMyClasses(),
        api.getMyInstitutions(),
      ]);
      setClasses(classesData);
      setInstitutions(institutionsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(isApiError(err) ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingClass && !formData.institutionId) {
      setError("Please select an institution");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingClass) {
        const updated = await api.updatePortalClass(editingClass.id, {
          name: formData.name,
          memo: formData.memo,
        });
        setClasses((prev) => prev.map((cls) => (cls.id === updated.id ? updated : cls)));
      } else {
        await api.createPortalClass({
          name: formData.name,
          memo: formData.memo,
          institutionId: formData.institutionId,
        });
        await fetchData();
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save class:", err);
      setError(isApiError(err) ? err.message : "Failed to save class");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading classes..." />
      </DashboardLayout>
    );
  }

  // Filter classes by institution
  const filteredClasses = filterInstitutionId
    ? classes.filter((cls) => cls.institutionId === filterInstitutionId)
    : classes;

  const institutionOptions = [
    { value: "", label: "All Institutions" },
    ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="My Classes"
        description="View and manage students in your accessible classes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Classes" }]}
        action={
          isInstitutionAdmin ? (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          ) : undefined
        }
      />
      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Institution Filter */}
      <div className="mb-6 max-w-xs">
        <Select
          options={institutionOptions}
          value={filterInstitutionId}
          onChange={(e) => handleInstitutionFilterChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filteredClasses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes found"
          description={
            filterInstitutionId
              ? "No classes found for this institution."
              : "You don't have access to any classes yet. Contact your administrator if you believe this is an error."
          }
          action={
            isInstitutionAdmin ? (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
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
                  {isInstitutionAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cls)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
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

      {/* Create/Edit Class Modal */}
      {isInstitutionAdmin && (
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          title={editingClass ? "Edit Class" : "Create Class"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingClass && (
              <Select
                label="Institution"
                options={[
                  { value: "", label: "Select Institution" },
                  ...adminInstitutions.map((inst) => ({
                    value: inst.institutionId,
                    label: inst.institutionName,
                  })),
                ]}
                value={formData.institutionId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, institutionId: e.target.value }))
                }
                required
              />
            )}
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter class name"
              required
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
                {editingClass ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

export default function ClassesPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingPage message="Loading classes..." />
        </DashboardLayout>
      }
    >
      <ClassesPageContent />
    </Suspense>
  );
}
