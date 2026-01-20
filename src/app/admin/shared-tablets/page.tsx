"use client";

import * as React from "react";
import Link from "next/link";
import { Tablet, Plus, Trash2, Building2, FolderOpen, Key } from "lucide-react";
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
import type { Institution, SharedTabletAccount } from "@/types";

export default function SharedTabletsPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = React.useState<string>("");
  const [tablets, setTablets] = React.useState<SharedTabletAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingTablet, setDeletingTablet] = React.useState<SharedTabletAccount | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    institutionId: "",
    loginId: "",
    pinCode: ""
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch institutions on mount
  React.useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await api.getInstitutions();
        setInstitutions(data);
        const firstInstitution = data[0];
        if (firstInstitution) {
          setSelectedInstitutionId(firstInstitution.id);
        }
      } catch (err) {
        console.error("Failed to fetch institutions:", err);
        setError("Failed to load institutions");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

  // Fetch tablets when institution changes
  React.useEffect(() => {
    if (!selectedInstitutionId) {
      setTablets([]);
      return;
    }
    const fetchTablets = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSharedTablets(selectedInstitutionId);
        setTablets(data);
      } catch (err) {
        console.error("Failed to fetch tablets:", err);
        setError("Failed to load shared tablets");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTablets();
  }, [selectedInstitutionId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institutionId || !formData.loginId) return;

    // Validate PIN code
    if (formData.pinCode && !/^\d{4,6}$/.test(formData.pinCode)) {
      setError("PIN code must be 4-6 digits");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name,
        loginId: formData.loginId,
        pinCode: formData.pinCode || undefined
      };
      const created = await api.createSharedTablet(formData.institutionId, payload);
      if (formData.institutionId === selectedInstitutionId) {
        setTablets((prev) => [...prev, created]);
      }
      setIsCreateModalOpen(false);
      setFormData({ name: "", institutionId: "", loginId: "", pinCode: "" });
    } catch (err: any) {
      setError(err.message || "Failed to create shared tablet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTablet) return;
    setIsSubmitting(true);
    try {
      await api.deleteSharedTablet(deletingTablet.id);
      setTablets((prev) => prev.filter((t) => t.id !== deletingTablet.id));
      setIsDeleteModalOpen(false);
      setDeletingTablet(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete shared tablet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "", institutionId: selectedInstitutionId, loginId: "", pinCode: "" });
    setIsCreateModalOpen(true);
  };

  const openDeleteModal = (tablet: SharedTabletAccount) => {
    setDeletingTablet(tablet);
    setIsDeleteModalOpen(true);
  };

  if (isLoading && institutions.length === 0) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Shared Tablets"
        description="Manage shared tablet accounts for institutions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Shared Tablets" },
        ]}
        action={
          <Button onClick={openCreateModal} disabled={institutions.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shared Tablet
          </Button>
        }
      />

      {/* Institution Filter */}
      <div className="mb-6">
        <Select
          label="Filter by Institution"
          value={selectedInstitutionId}
          onChange={(e) => setSelectedInstitutionId(e.target.value)}
        >
          <option value="">Select institution</option>
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!selectedInstitutionId ? (
        <EmptyState
          icon={Building2}
          title="Select an institution"
          description="Choose an institution to view its shared tablets."
        />
      ) : tablets.length === 0 ? (
        <EmptyState
          icon={Tablet}
          title="No shared tablets"
          description="Create your first shared tablet for this institution."
          action={
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shared Tablet
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tablets.map((tablet) => (
            <Card key={tablet.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Tablet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tablet.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(tablet.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteModal(tablet)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {tablet.loginId && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Login ID:</span> {tablet.loginId}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <FolderOpen className="mr-1 h-3 w-3" />
                    {tablet._count?.portfolios || 0} portfolios
                  </Badge>
                  {tablet.hasPinCode && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Key className="mr-1 h-3 w-3" />
                      PIN Set
                    </Badge>
                  )}
                </div>

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

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Shared Tablet"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Institution"
            value={formData.institutionId}
            onChange={(e) => setFormData((prev) => ({ ...prev, institutionId: e.target.value }))}
            required
          >
            <option value="">Select institution</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </Select>
          <Input
            label="Tablet Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Tablet 1, Front Desk"
            required
          />
          <Input
            label="Login ID"
            value={formData.loginId}
            onChange={(e) => setFormData((prev) => ({ ...prev, loginId: e.target.value }))}
            placeholder="e.g., tablet001"
            required
          />
          <Input
            label="PIN Code (4-6 digits)"
            type="password"
            value={formData.pinCode}
            onChange={(e) => setFormData((prev) => ({ ...prev, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            placeholder="e.g., 1234"
            maxLength={6}
          />
          <p className="text-sm text-gray-500">
            PIN code is optional. Users can login with just the Login ID if no PIN is set.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Shared Tablet"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deletingTablet?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isSubmitting}>
            Delete
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
