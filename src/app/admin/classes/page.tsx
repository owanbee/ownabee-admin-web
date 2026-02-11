"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Pencil,
  Building2,
  Tablet,
  UserCheck,
  UserCircle,
} from "lucide-react";
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
import type { InstitutionClass, Institution } from "@/types";

function AdminClassesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filterInstitutionId, setFilterInstitutionId] = useState("");

  // Initialize from URL params on mount
  useEffect(() => {
    const institutionId = searchParams.get("institutionId");
    if (institutionId) {
      setFilterInstitutionId(institutionId);
    }
  }, [searchParams]);

  const handleInstitutionFilterChange = (institutionId: string) => {
    setFilterInstitutionId(institutionId);
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    router.push(`/admin/classes?${params.toString()}`);
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<InstitutionClass | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    memo: "",
    institutionId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [classesData, institutionsData] = await Promise.all([
        api.getClasses(filterInstitutionId || undefined),
        api.getInstitutions(),
      ]);
      setClasses(classesData);
      setInstitutions(institutionsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [filterInstitutionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      setFormData({
        name: "",
        memo: "",
        institutionId: filterInstitutionId || institutions[0]?.id || "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setFormData({ name: "", memo: "", institutionId: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingClass) {
        const updated = await api.updateClass(editingClass.id, {
          name: formData.name,
          memo: formData.memo,
        });
        setClasses((prev) => prev.map((cls) => (cls.id === updated.id ? updated : cls)));
      } else {
        const created = await api.createClass(formData);
        setClasses((prev) => [...prev, created]);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save class:", err);
      setError(err instanceof Error ? err.message : "Failed to save class");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading classes..." />
      </AdminLayout>
    );
  }

  const institutionOptions = [
    { value: "", label: "All Institutions" },
    ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Manage Classes"
        description="Create and manage classes across all institutions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Classes" },
        ]}
        action={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Filter */}
      <div className="mb-6 flex flex-col gap-2 max-w-xs">
        <Select
          options={institutionOptions}
          value={filterInstitutionId}
          onChange={(e) => handleInstitutionFilterChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description={
            filterInstitutionId
              ? "No classes found for this institution."
              : "Create your first class to get started."
          }
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
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
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cls)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
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
                  <Link href={`/admin/classes/${cls.id}`}>
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
        title={editingClass ? "Edit Class" : "Create Class"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingClass && (
            <Select
              label="Institution"
              options={institutions.map((inst) => ({
                value: inst.id,
                label: inst.name,
              }))}
              value={formData.institutionId}
              onChange={(e) => setFormData((prev) => ({ ...prev, institutionId: e.target.value }))}
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
    </AdminLayout>
  );
}

export default function AdminClassesPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <LoadingPage message="Loading classes..." />
        </AdminLayout>
      }
    >
      <AdminClassesPageContent />
    </Suspense>
  );
}
