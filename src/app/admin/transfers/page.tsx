"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRightLeft, Tablet, UserCheck, FolderOpen, Check, History } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { Institution, SharedTabletAccount, InstitutionParent, Portfolio, TransferSourceAction } from "@/types";

export default function TransfersPage() {
  const searchParams = useSearchParams();
  const preselectedTabletId = searchParams.get("tabletId");

  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = React.useState<string>("");
  const [tablets, setTablets] = React.useState<SharedTabletAccount[]>([]);
  const [selectedTabletId, setSelectedTabletId] = React.useState<string>("");
  const [portfolios, setPortfolios] = React.useState<Portfolio[]>([]);
  const [parents, setParents] = React.useState<InstitutionParent[]>([]);
  const [selectedParentId, setSelectedParentId] = React.useState<string>("");
  const [selectedPortfolioIds, setSelectedPortfolioIds] = React.useState<string[]>([]);
  const [sourceAction, setSourceAction] = React.useState<TransferSourceAction>("KEEP");

  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const [isTransferring, setIsTransferring] = React.useState(false);
  const [transferSuccess, setTransferSuccess] = React.useState(false);

  // Fetch institutions on mount
  React.useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await api.getInstitutions();
        setInstitutions(data);
        if (data.length > 0) {
          setSelectedInstitutionId(data[0].id);
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

  // Fetch tablets and parents when institution changes
  React.useEffect(() => {
    if (!selectedInstitutionId) {
      setTablets([]);
      setParents([]);
      return;
    }
    const fetchData = async () => {
      try {
        const [tabletsData, parentsData] = await Promise.all([
          api.getSharedTablets(selectedInstitutionId),
          api.getInstitutionParents(selectedInstitutionId),
        ]);
        setTablets(tabletsData);
        setParents(parentsData);

        // Handle preselected tablet
        if (preselectedTabletId && tabletsData.some(t => t.id === preselectedTabletId)) {
          setSelectedTabletId(preselectedTabletId);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [selectedInstitutionId, preselectedTabletId]);

  // Fetch portfolios when tablet changes
  React.useEffect(() => {
    if (!selectedTabletId) {
      setPortfolios([]);
      return;
    }
    const tablet = tablets.find(t => t.id === selectedTabletId);
    if (!tablet?.profileId) return;

    const fetchPortfolios = async () => {
      setIsLoadingPortfolios(true);
      try {
        const data = await api.getPortfolios(tablet.profileId);
        setPortfolios(data);
      } catch (err) {
        console.error("Failed to fetch portfolios:", err);
      } finally {
        setIsLoadingPortfolios(false);
      }
    };
    fetchPortfolios();
  }, [selectedTabletId, tablets]);

  const togglePortfolio = (id: string) => {
    setSelectedPortfolioIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllPortfolios = () => {
    if (selectedPortfolioIds.length === portfolios.length) {
      setSelectedPortfolioIds([]);
    } else {
      setSelectedPortfolioIds(portfolios.map((p) => p.id));
    }
  };

  const handleTransfer = async () => {
    if (!selectedParentId || selectedPortfolioIds.length === 0) return;

    const tablet = tablets.find(t => t.id === selectedTabletId);
    if (!tablet?.profileId) return;

    setIsTransferring(true);
    setError(null);
    try {
      await api.transferPortfolios({
        institutionParentId: selectedParentId,
        sourceProfileId: tablet.profileId,
        portfolioIds: selectedPortfolioIds,
        sourceAction,
      });
      setTransferSuccess(true);
      setIsConfirmModalOpen(false);

      // Refresh portfolios
      const updatedPortfolios = await api.getPortfolios(tablet.profileId);
      setPortfolios(updatedPortfolios);
      setSelectedPortfolioIds([]);
    } catch (err: any) {
      setError(err.message || "Failed to transfer portfolios");
    } finally {
      setIsTransferring(false);
    }
  };

  const selectedParent = parents.find((p) => p.id === selectedParentId);
  const selectedTablet = tablets.find((t) => t.id === selectedTabletId);

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Portfolio Transfer"
        description="Transfer portfolios from shared tablets to parent accounts"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Transfers" },
        ]}
        action={
          <Link href="/admin/transfers/history">
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {transferSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-600">
          Portfolios transferred successfully!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Step 1: Select Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tablet className="h-5 w-5" />
              1. Select Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Institution"
              value={selectedInstitutionId}
              onChange={(e) => {
                setSelectedInstitutionId(e.target.value);
                setSelectedTabletId("");
                setSelectedParentId("");
                setSelectedPortfolioIds([]);
              }}
            >
              <option value="">Select institution</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </Select>

            <Select
              label="Shared Tablet"
              value={selectedTabletId}
              onChange={(e) => {
                setSelectedTabletId(e.target.value);
                setSelectedPortfolioIds([]);
              }}
              disabled={!selectedInstitutionId}
            >
              <option value="">Select tablet</option>
              {tablets.map((tablet) => (
                <option key={tablet.id} value={tablet.id}>{tablet.name}</option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* Step 2: Select Target */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              2. Select Target Parent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Parent"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              disabled={!selectedInstitutionId}
            >
              <option value="">Select parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.childName} ({parent.user?.email})
                </option>
              ))}
            </Select>

            {selectedParent && (
              <div className="mt-4 rounded-md bg-gray-50 p-3">
                <p className="font-medium">{selectedParent.childName}</p>
                <p className="text-sm text-gray-500">{selectedParent.user?.name}</p>
                <p className="text-sm text-gray-500">{selectedParent.user?.email}</p>
                <Badge className="mt-2" variant={selectedParent.status === "ACTIVE" ? "success" : "secondary"}>
                  {selectedParent.status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              3. Transfer Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="After Transfer"
              value={sourceAction}
              onChange={(e) => setSourceAction(e.target.value as TransferSourceAction)}
            >
              <option value="KEEP">Keep original (copy)</option>
              <option value="DELETE">Delete original (move)</option>
            </Select>

            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {sourceAction === "KEEP"
                ? "Portfolios will be copied. Originals remain in the shared tablet."
                : "Portfolios will be moved. Originals will be deleted from the shared tablet."}
            </div>

            <Button
              className="w-full"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={!selectedParentId || selectedPortfolioIds.length === 0}
            >
              Transfer {selectedPortfolioIds.length} Portfolio(s)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Portfolios Selection */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Select Portfolios ({selectedPortfolioIds.length}/{portfolios.length})
            </span>
            {portfolios.length > 0 && (
              <Button variant="outline" size="sm" onClick={selectAllPortfolios}>
                {selectedPortfolioIds.length === portfolios.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedTabletId ? (
            <EmptyState icon={Tablet} title="Select a tablet" description="Choose a shared tablet to view its portfolios." />
          ) : isLoadingPortfolios ? (
            <div className="text-center py-8 text-gray-500">Loading portfolios...</div>
          ) : portfolios.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No portfolios" description="This tablet has no portfolios to transfer." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {portfolios.map((portfolio) => {
                const isSelected = selectedPortfolioIds.includes(portfolio.id);
                return (
                  <div
                    key={portfolio.id}
                    onClick={() => togglePortfolio(portfolio.id)}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                      isSelected ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary-500 text-white" : "bg-gray-100"
                      }`}>
                        {isSelected ? <Check className="h-5 w-5" /> : <FolderOpen className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{portfolio.title}</p>
                        <p className="text-sm text-gray-500">{portfolio.contentItems?.length || 0} items</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Transfer">
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to transfer <strong>{selectedPortfolioIds.length}</strong> portfolio(s)
            from <strong>{selectedTablet?.name}</strong> to <strong>{selectedParent?.childName}</strong>.
          </p>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm font-medium">After transfer:</p>
            <p className="text-sm text-gray-600">
              {sourceAction === "KEEP"
                ? "Original portfolios will be kept (copy operation)"
                : "Original portfolios will be deleted (move operation)"}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
          <Button onClick={handleTransfer} isLoading={isTransferring}>
            Confirm Transfer
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
