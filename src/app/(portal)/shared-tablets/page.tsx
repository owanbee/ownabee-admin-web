"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Tablet, GraduationCap, Building2, Plus, Pencil } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useIsInstitutionAdmin, useAuthStore } from "@/stores/authStore";
import type { SharedTablet, InstitutionClass, Institution } from "@/types";

function SharedTabletsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInstitutionAdmin = useIsInstitutionAdmin();
  const portalInfo = useAuthStore((state) => state.portalInfo);

  const [tablets, setTablets] = React.useState<SharedTablet[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [filterInstitutionId, setFilterInstitutionId] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTablet, setEditingTablet] = React.useState<SharedTablet | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    institutionId: "",
    institutionClassId: "",
    memo: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  // Check if user can create shared tablets (TEACHER or INSTITUTION_ADMIN)
  const canCreateTablet = accessibleInstitutions.length > 0;

  const handleInstitutionChange = (institutionId: string) => {
    setFilterInstitutionId(institutionId);
    setSelectedClassId(""); // Reset class filter when institution changes
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    router.push(`/shared-tablets?${params.toString()}`);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const params = new URLSearchParams();
    if (filterInstitutionId) params.set("institutionId", filterInstitutionId);
    if (classId) params.set("classId", classId);
    router.push(`/shared-tablets?${params.toString()}`);
  };

  const handleOpenModal = (tablet?: SharedTablet) => {
    if (tablet) {
      setEditingTablet(tablet);
      setFormData({
        name: tablet.name,
        username: tablet.username || "",
        password: "",
        institutionId: tablet.institutionId,
        institutionClassId: tablet.institutionClassId,
        memo: tablet.memo || "",
      });
    } else {
      setEditingTablet(null);
      setFormData({
        name: "",
        username: "",
        password: "",
        institutionId: filterInstitutionId || "",
        institutionClassId: selectedClassId || "",
        memo: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTablet(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      institutionId: "",
      institutionClassId: "",
      memo: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingTablet) {
        await api.updatePortalSharedTablet(editingTablet.id, {
          name: formData.name,
          ...(formData.memo && { memo: formData.memo }),
          ...(formData.password && { password: formData.password }),
        });
      } else {
        await api.createPortalSharedTablet({
          institutionId: formData.institutionId,
          institutionClassId: formData.institutionClassId,
          username: formData.username,
          password: formData.password,
          name: formData.name,
          ...(formData.memo && { memo: formData.memo }),
        });
      }
      handleCloseModal();
      fetchTablets();
    } catch (err) {
      console.error("Failed to save tablet:", err);
      setError(err instanceof Error ? err.message : "Failed to save tablet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTablets = React.useCallback(async () => {
    try {
      if (selectedClassId || filterInstitutionId) {
        // Fetch tablets for specific class or institution
        const result = await api.getPortalSharedTablets({
          institutionId: filterInstitutionId ?? "",
          institutionClassId: selectedClassId ?? "",
        });
        setTablets(result.tablets);
      } else {
        // Fetch all tablets from all classes
        const data = await api.getMySharedTablets();
        setTablets(data.tablets);
      }
    } catch (err) {
      console.error("Failed to fetch tablets:", err);
      setError(err instanceof Error ? err.message : "Failed to load tablets");
    }
  }, [selectedClassId, filterInstitutionId]);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Get URL params first
        const classIdParam = searchParams.get("classId");
        const institutionIdParam = searchParams.get("institutionId");
        if (classIdParam) setSelectedClassId(classIdParam);
        if (institutionIdParam) setFilterInstitutionId(institutionIdParam);

        // Fetch data
        const [classesData, institutionsData, tabletsResult] = await Promise.all([
          api.getMyClasses(),
          api.getMyInstitutions(),
          classIdParam || institutionIdParam
            ? api.getPortalSharedTablets({
                institutionId: institutionIdParam ?? "",
                institutionClassId: classIdParam ?? "",
              })
            : api.getMySharedTablets(),
        ]);

        setClasses(classesData);
        setInstitutions(institutionsData);
        setTablets(tabletsResult.tablets);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  // Refetch tablets when class filter changes manually
  React.useEffect(() => {
    if (!isLoading) {
      fetchTablets();
    }
  }, [fetchTablets, isLoading]);

  // Reset class filter when institution changes and class doesn't belong to institution
  React.useEffect(() => {
    if (filterInstitutionId && selectedClassId) {
      const selectedClass = classes.find((cls) => cls.id === selectedClassId);
      if (selectedClass && selectedClass.institutionId !== filterInstitutionId) {
        setSelectedClassId("");
      }
    }
  }, [filterInstitutionId, selectedClassId, classes]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading shared tablets..." />
      </DashboardLayout>
    );
  }

  // Filter classes and tablets by institution
  const filteredClasses = filterInstitutionId
    ? classes.filter((cls) => cls.institutionId === filterInstitutionId)
    : classes;

  const filteredTablets = filterInstitutionId
    ? tablets.filter((tablet) => tablet.institutionId === filterInstitutionId)
    : tablets;

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
        title="My Shared Tablets"
        description="View shared tablets in your accessible classes"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Shared Tablets" }]}
        action={
          canCreateTablet ? (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shared Tablet
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

      {filteredTablets.length === 0 ? (
        <EmptyState
          icon={Tablet}
          title="No shared tablets found"
          description={
            filterInstitutionId || selectedClassId
              ? "No shared tablets found for the selected filters."
              : "You don't have access to any shared tablets yet. Contact your administrator if you believe this is an error."
          }
          action={
            canCreateTablet ? (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Shared Tablet
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTablets.map((tablet) => (
            <Card key={tablet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <Tablet className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tablet.name}</h3>
                      {tablet.username && (
                        <p className="text-sm text-gray-500">@{tablet.username}</p>
                      )}
                    </div>
                  </div>
                  {canCreateTablet && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(tablet)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  {tablet.institution && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span className="text-gray-500">{tablet.institution.name}</span>
                    </div>
                  )}
                  {tablet.institutionClass && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-gray-500">{tablet.institutionClass.name}</span>
                    </div>
                  )}
                </div>
                {tablet.memo && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{tablet.memo}</p>
                )}
                <p className="mt-3 text-xs text-gray-400">Created {formatDate(tablet.createdAt)}</p>
                <div className="mt-4">
                  <Link href={`/shared-tablets/${tablet.id}`}>
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
      {canCreateTablet && (
        <Modal
          open={isModalOpen}
          onClose={handleCloseModal}
          title={editingTablet ? "Edit Shared Tablet" : "Create Shared Tablet"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingTablet && (
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
                  value={formData.institutionClassId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, institutionClassId: e.target.value }))
                  }
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
              label={editingTablet ? "New Password (Optional)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={
                editingTablet ? "Leave blank to keep current password" : "Enter password (required)"
              }
              required={!editingTablet}
            />
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter tablet name (required)"
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
                {editingTablet ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}

export default function SharedTabletsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingPage message="Loading shared tablets..." />
        </DashboardLayout>
      }
    >
      <SharedTabletsPageContent />
    </Suspense>
  );
}
