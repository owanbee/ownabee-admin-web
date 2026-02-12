"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Tablet, Plus, Pencil, Building2, GraduationCap } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SharedTablet, Institution, InstitutionClass } from "@/types";

function AdminSharedTabletsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tablets, setTablets] = useState<SharedTablet[]>([]);
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
    router.push(`/admin/shared-tablets?${params.toString()}`);
  };

  const handleClassFilterChange = (classId: string) => {
    setFilterClassId(classId);

    const params = new URLSearchParams();
    if (filterInstitutionId) params.set("institutionId", filterInstitutionId);
    if (classId) params.set("classId", classId);
    router.push(`/admin/shared-tablets?${params.toString()}`);
  };

  // Fetch tablets function (reusable)
  const fetchTablets = useCallback(async () => {
    try {
      const params: { institutionId?: string; institutionClassId?: string } = {};
      if (filterInstitutionId) params.institutionId = filterInstitutionId;
      if (filterClassId) params.institutionClassId = filterClassId;

      const tabletsData = await api.getSharedTablets(params);
      setTablets(tabletsData.tablets);
    } catch (err) {
      console.error("Failed to fetch tablets:", err);
      setError(err instanceof Error ? err.message : "Failed to load tablets");
    }
  }, [filterInstitutionId, filterClassId]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTablet, setEditingTablet] = useState<SharedTablet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    institutionId: "",
    institutionClassId: "",
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

        // Fetch tablets with URL params
        const params: { institutionId?: string; institutionClassId?: string } = {};
        if (institutionIdParam) params.institutionId = institutionIdParam;
        if (classIdParam) params.institutionClassId = classIdParam;

        const tabletsData = await api.getSharedTablets(params);
        setTablets(tabletsData.tablets);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Refetch tablets when filters change manually
  useEffect(() => {
    // Only fetch if not initial load
    if (!isLoading) {
      fetchTablets();
    }
  }, [fetchTablets, isLoading]);

  // Reset class filter when institution changes
  useEffect(() => {
    if (filterInstitutionId && filterClassId) {
      const selectedClass = classes.find((cls) => cls.id === filterClassId);
      if (selectedClass && selectedClass.institutionId !== filterInstitutionId) {
        setFilterClassId("");
      }
    }
  }, [filterInstitutionId, filterClassId, classes]);

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
        institutionClassId: filterClassId || "",
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
        await api.updateSharedTablet(editingTablet.id, {
          name: formData.name,
          ...(formData.memo && { memo: formData.memo }),
          ...(formData.password && { password: formData.password }),
        });
      } else {
        await api.createSharedTablet({
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

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading shared tablets..." />
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
        title="Manage Shared Tablets"
        description="Create and manage shared tablet accounts across all institutions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Shared Tablets" },
        ]}
        action={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shared Tablet
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

      {tablets.length === 0 ? (
        <EmptyState
          icon={Tablet}
          title="No shared tablets yet"
          description={
            filterInstitutionId
              ? "No shared tablets found for this institution."
              : "Create your first shared tablet to get started."
          }
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shared Tablet
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tablets.map((tablet) => (
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
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(tablet)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{tablet.institution?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-gray-500">{tablet.institutionClass?.name}</span>
                  </div>
                </div>
                {tablet.memo && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{tablet.memo}</p>
                )}
                <p className="mt-3 text-xs text-gray-400">Created {formatDate(tablet.createdAt)}</p>
                <div className="mt-4">
                  <Link href={`/admin/shared-tablets/${tablet.id}`}>
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
        title={editingTablet ? "Edit Shared Tablet" : "Create Shared Tablet"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingTablet && (
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
    </AdminLayout>
  );
}

export default function AdminSharedTabletsPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <LoadingPage message="Loading shared tablets..." />
        </AdminLayout>
      }
    >
      <AdminSharedTabletsPageContent />
    </Suspense>
  );
}
