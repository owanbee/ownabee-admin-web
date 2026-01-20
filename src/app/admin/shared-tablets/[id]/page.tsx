"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Tablet, ArrowLeft, FolderOpen, ArrowRightLeft, Trash2, Key } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { SharedTabletAccount, Portfolio } from "@/types";

export default function SharedTabletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tablet, setTablet] = React.useState<SharedTabletAccount | null>(null);
  const [portfolios, setPortfolios] = React.useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [newPinCode, setNewPinCode] = React.useState("");
  const [isUpdatingPin, setIsUpdatingPin] = React.useState(false);
  const [pinError, setPinError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const tabletData = await api.getSharedTablet(id);
        setTablet(tabletData);

        // Fetch portfolios for this tablet's profile
        if (tabletData.profileId) {
          const portfolioData = await api.getPortfolios(tabletData.profileId);
          setPortfolios(portfolioData);
        }
      } catch (err: any) {
        console.error("Failed to fetch tablet:", err);
        setError(err.message || "Failed to load shared tablet");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteSharedTablet(id);
      router.push("/admin/shared-tablets");
    } catch (err: any) {
      setError(err.message || "Failed to delete tablet");
      setIsDeleting(false);
    }
  };

  const handleUpdatePin = async () => {
    if (!/^\d{4,6}$/.test(newPinCode)) {
      setPinError("PIN code must be 4-6 digits");
      return;
    }

    setIsUpdatingPin(true);
    setPinError(null);
    try {
      await api.updateTabletPin(id, newPinCode);
      setTablet((prev) => prev ? { ...prev, hasPinCode: true } : prev);
      setIsPinModalOpen(false);
      setNewPinCode("");
    } catch (err: any) {
      setPinError(err.message || "Failed to update PIN");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading shared tablet..." />
      </AdminLayout>
    );
  }

  if (error || !tablet) {
    return (
      <AdminLayout>
        <div className="rounded-md bg-red-50 p-4 text-red-600">
          {error || "Shared tablet not found"}
        </div>
        <Link href="/admin/shared-tablets">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shared Tablets
          </Button>
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={tablet.name}
        description="Shared tablet account details"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Shared Tablets", href: "/admin/shared-tablets" },
          { label: tablet.name },
        ]}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/transfers?tabletId=${tablet.id}`}>
              <Button>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer Portfolios
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Tablet Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            Tablet Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-gray-900">{tablet.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Login ID</dt>
              <dd className="text-gray-900 font-mono">{tablet.loginId || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Institution</dt>
              <dd className="text-gray-900">{tablet.institution?.name || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-gray-900">{formatDate(tablet.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Portfolios</dt>
              <dd className="text-gray-900">{portfolios.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">PIN Status</dt>
              <dd className="flex items-center gap-2">
                {tablet.hasPinCode ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Key className="mr-1 h-3 w-3" />
                    PIN Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    No PIN
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPinModalOpen(true)}
                  className="text-sm"
                >
                  {tablet.hasPinCode ? "Reset PIN" : "Set PIN"}
                </Button>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Portfolios Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Portfolios ({portfolios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {portfolios.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No portfolios yet"
              description="This shared tablet has no portfolios."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((portfolio) => (
                <Card key={portfolio.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {portfolio.coverImage ? (
                        <img
                          src={portfolio.coverImage}
                          alt={portfolio.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                          <FolderOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{portfolio.title}</h4>
                        <p className="text-sm text-gray-500">{formatDate(portfolio.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Shared Tablet"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{tablet.name}</strong>?
          This will also remove the associated profile and all its data.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* PIN Update Modal */}
      <Modal
        open={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setNewPinCode("");
          setPinError(null);
        }}
        title={tablet.hasPinCode ? "Reset PIN Code" : "Set PIN Code"}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Enter a new 4-6 digit PIN code for this tablet.
          </p>
          <Input
            label="New PIN Code"
            type="password"
            value={newPinCode}
            onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 4-6 digits"
            maxLength={6}
          />
          {pinError && (
            <p className="text-sm text-red-600">{pinError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsPinModalOpen(false);
                setNewPinCode("");
                setPinError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePin} isLoading={isUpdatingPin}>
              {tablet.hasPinCode ? "Reset PIN" : "Set PIN"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
