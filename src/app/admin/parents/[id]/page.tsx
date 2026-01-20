"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserCheck, ArrowLeft, Save, Trash2, History, ArrowRightLeft } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { InstitutionParent, PortfolioTransfer } from "@/types";

export default function ParentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [parent, setParent] = React.useState<InstitutionParent | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit state
  const [formData, setFormData] = React.useState({
    childName: "",
    phoneNumber: "",
    memo: "",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getInstitutionParent(id);
        setParent(data);
        setFormData({
          childName: data.childName,
          phoneNumber: data.phoneNumber || "",
          memo: data.memo || "",
        });
      } catch (err: any) {
        console.error("Failed to fetch parent:", err);
        setError(err.message || "Failed to load parent");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!parent) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.updateInstitutionParent(id, {
        childName: formData.childName,
        phoneNumber: formData.phoneNumber || undefined,
        memo: formData.memo || undefined,
      });
      setParent(updated);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteInstitutionParent(id);
      router.push("/admin/parents");
    } catch (err: any) {
      setError(err.message || "Failed to delete parent");
      setIsDeleting(false);
    }
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

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading parent details..." />
      </AdminLayout>
    );
  }

  if (error && !parent) {
    return (
      <AdminLayout>
        <div className="rounded-md bg-red-50 p-4 text-red-600">{error}</div>
        <Link href="/admin/parents">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Parents
          </Button>
        </Link>
      </AdminLayout>
    );
  }

  if (!parent) return null;

  return (
    <AdminLayout>
      <PageHeader
        title={parent.childName}
        description="Parent account details"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Parents", href: "/admin/parents" },
          { label: parent.childName },
        ]}
        action={
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!hasChanges} isLoading={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Parent Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Parent Information
              </span>
              {getStatusBadge(parent.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Parent Account</label>
              <p className="text-gray-900">{parent.user?.name || "No name"}</p>
              <p className="text-sm text-gray-500">{parent.user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Institution</label>
              <p className="text-gray-900">{parent.institution?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Registered</label>
              <p className="text-gray-900">{formatDate(parent.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Child Name"
              value={formData.childName}
              onChange={(e) => handleInputChange("childName", e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="010-0000-0000"
            />
            <Textarea
              label="Memo"
              value={formData.memo}
              onChange={(e) => handleInputChange("memo", e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transfer History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!parent.transfers || parent.transfers.length === 0) ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No transfers yet"
              description="No portfolios have been transferred for this parent."
            />
          ) : (
            <div className="space-y-3">
              {parent.transfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{transfer.portfolio?.title || "Unknown portfolio"}</p>
                    <p className="text-sm text-gray-500">
                      From: {transfer.sourceProfile?.name || "Unknown"} → To: {transfer.targetProfile?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={transfer.sourceAction === "DELETE" ? "destructive" : "secondary"}>
                      {transfer.sourceAction}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(transfer.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Parent">
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{parent.childName}</strong>'s parent registration?
          This will not affect any previously transferred portfolios.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>Delete</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
