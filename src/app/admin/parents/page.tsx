"use client";

import * as React from "react";
import Link from "next/link";
import { UserCheck, Plus, Pencil, Trash2, Building2, Search } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { UserSearchInput } from "@/components/forms/UserSearchInput";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Institution, InstitutionParent, UserSearchResult } from "@/types";

export default function ParentsPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = React.useState<string>("");
  const [parents, setParents] = React.useState<InstitutionParent[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserSearchResult | null>(null);
  const [createFormData, setCreateFormData] = React.useState({
    institutionId: "",
    childName: "",
    phoneNumber: "",
    memo: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingParent, setDeletingParent] = React.useState<InstitutionParent | null>(null);

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

  // Fetch parents when institution or search changes
  React.useEffect(() => {
    if (!selectedInstitutionId) {
      setParents([]);
      return;
    }
    const fetchParents = async () => {
      try {
        setIsLoading(true);
        const data = await api.getInstitutionParents(selectedInstitutionId, searchQuery || undefined);
        setParents(data);
      } catch (err) {
        console.error("Failed to fetch parents:", err);
        setError("Failed to load parents");
      } finally {
        setIsLoading(false);
      }
    };
    const debounce = setTimeout(fetchParents, 300);
    return () => clearTimeout(debounce);
  }, [selectedInstitutionId, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !createFormData.institutionId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.createInstitutionParent(createFormData.institutionId, {
        userId: selectedUser.id,
        childName: createFormData.childName,
        phoneNumber: createFormData.phoneNumber || undefined,
        memo: createFormData.memo || undefined,
      });
      if (createFormData.institutionId === selectedInstitutionId) {
        setParents((prev) => [...prev, created]);
      }
      closeCreateModal();
    } catch (err: any) {
      setError(err.message || "Failed to create parent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingParent) return;
    setIsSubmitting(true);
    try {
      await api.deleteInstitutionParent(deletingParent.id);
      setParents((prev) => prev.filter((p) => p.id !== deletingParent.id));
      setIsDeleteModalOpen(false);
      setDeletingParent(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete parent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setCreateFormData({
      institutionId: selectedInstitutionId,
      childName: "",
      phoneNumber: "",
      memo: "",
    });
    setSelectedUser(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedUser(null);
    setCreateFormData({ institutionId: "", childName: "", phoneNumber: "", memo: "" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "REGISTERED":
      default:
        return <Badge variant="secondary">Registered</Badge>;
    }
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
        title="Parents"
        description="Manage institution parents for portfolio transfers"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Parents" },
        ]}
        action={
          <Button onClick={openCreateModal} disabled={institutions.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Register Parent
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-64">
          <Select
            label="Institution"
            value={selectedInstitutionId}
            onChange={(e) => setSelectedInstitutionId(e.target.value)}
          >
            <option value="">Select institution</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <Input
            label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by child name or parent email..."
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!selectedInstitutionId ? (
        <EmptyState
          icon={Building2}
          title="Select an institution"
          description="Choose an institution to view its registered parents."
        />
      ) : parents.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No parents registered"
          description="Register a parent to enable portfolio transfers."
          action={
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Register Parent
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parents.map((parent) => (
            <Card key={parent.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{parent.childName}</h3>
                      <p className="text-sm text-gray-500">{parent.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/parents/${parent.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingParent(parent);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {parent.phoneNumber && <p>Phone: {parent.phoneNumber}</p>}
                  <p>Registered: {formatDate(parent.createdAt)}</p>
                </div>

                <div className="mt-3">
                  {getStatusBadge(parent.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={isCreateModalOpen} onClose={closeCreateModal} title="Register Parent">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Institution"
            value={createFormData.institutionId}
            onChange={(e) => setCreateFormData((prev) => ({ ...prev, institutionId: e.target.value }))}
            required
          >
            <option value="">Select institution</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </Select>

          {/* User Search */}
          <UserSearchInput
            label="Find Parent Account"
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Search by parent's email"
            required
          />

          <Input
            label="Child Name"
            value={createFormData.childName}
            onChange={(e) => setCreateFormData((prev) => ({ ...prev, childName: e.target.value }))}
            placeholder="Enter child's name"
            required
          />

          <Input
            label="Phone Number (optional)"
            value={createFormData.phoneNumber}
            onChange={(e) => setCreateFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="010-0000-0000"
          />

          <Textarea
            label="Memo (optional)"
            value={createFormData.memo}
            onChange={(e) => setCreateFormData((prev) => ({ ...prev, memo: e.target.value }))}
            placeholder="Additional notes..."
            rows={2}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeCreateModal}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!selectedUser}>
              Register
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Parent">
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deletingParent?.childName}</strong>'s parent record?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isSubmitting}>Delete</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
