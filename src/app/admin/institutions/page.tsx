"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Plus, Pencil, Users, GraduationCap, UserCircle, Tablet } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate, isApiError } from "@/lib/utils";
import type { Institution } from "@/types";

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingInstitution, setEditingInstitution] = React.useState<Institution | null>(null);
  const [formData, setFormData] = React.useState({ name: "", memo: "" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchInstitutions = React.useCallback(async () => {
    try {
      const data = await api.getInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
      setError(isApiError(err) ? err.message : "Failed to load institutions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const handleOpenModal = (institution?: Institution) => {
    if (institution) {
      setEditingInstitution(institution);
      setFormData({
        name: institution.name,
        memo: institution.memo || "",
      });
    } else {
      setEditingInstitution(null);
      setFormData({ name: "", memo: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInstitution(null);
    setFormData({ name: "", memo: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingInstitution) {
        const updated = await api.updateInstitution(editingInstitution.id, formData);
        setInstitutions((prev) => prev.map((inst) => (inst.id === updated.id ? updated : inst)));
      } else {
        const created = await api.createInstitution(formData);
        setInstitutions((prev) => [...prev, created]);
      }
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save institution:", err);
      setError(isApiError(err) ? err.message : "Failed to save institution");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading institutions..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Institutions"
        description="Manage institutions in the system"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Institutions" },
        ]}
        action={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Institution
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {institutions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No institutions yet"
          description="Create your first institution to get started."
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Institution
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution) => (
            <Card key={institution.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{institution.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(institution.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(institution)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                {institution.memo && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{institution.memo}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <GraduationCap className="mr-1 h-3 w-3" />
                    {institution._count?.institutionClasses || 0} classes
                  </Badge>
                  <Badge variant="secondary">
                    <UserCircle className="mr-1 h-3 w-3" />
                    {institution._count?.students || 0} students
                  </Badge>
                  <Badge variant="secondary">
                    <Tablet className="mr-1 h-3 w-3" />
                    {institution._count?.sharedTablets || 0} tablets
                  </Badge>
                  <Badge variant="secondary">
                    <Users className="mr-1 h-3 w-3" />
                    {institution._count?.members || 0} members
                  </Badge>
                </div>

                <div className="mt-4">
                  <Link href={`/admin/institutions/${institution.id}`}>
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
        title={editingInstitution ? "Edit Institution" : "Create Institution"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter institution name"
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
              {editingInstitution ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
