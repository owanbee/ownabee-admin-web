"use client";

import * as React from "react";
import Link from "next/link";
import { History, ArrowLeft, ArrowRight, Building2, Calendar } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Institution, PortfolioTransfer } from "@/types";

export default function TransferHistoryPage() {
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [transfers, setTransfers] = React.useState<PortfolioTransfer[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch institutions on mount
  React.useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await api.getInstitutions();
        setInstitutions(data);
      } catch (err) {
        console.error("Failed to fetch institutions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

  // Fetch transfer history when filters change
  React.useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setIsLoading(true);
        const data = await api.getTransferHistory({
          institutionId: selectedInstitutionId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setTransfers(data);
      } catch (err: any) {
        console.error("Failed to fetch transfers:", err);
        setError(err.message || "Failed to load transfer history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransfers();
  }, [selectedInstitutionId, startDate, endDate]);

  const clearFilters = () => {
    setSelectedInstitutionId("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Transfer History"
        description="View all portfolio transfer records"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Transfers", href: "/admin/transfers" },
          { label: "History" },
        ]}
        action={
          <Link href="/admin/transfers">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transfers
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full md:w-64">
              <Select
                label="Institution"
                value={selectedInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
              >
                <option value="">All institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Transfer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transfers ({transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : transfers.length === 0 ? (
            <EmptyState
              icon={History}
              title="No transfers found"
              description="No portfolio transfers match your filters."
            />
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {transfer.portfolio?.title || "Unknown Portfolio"}
                      </h4>
                      <Badge variant={transfer.sourceAction === "DELETE" ? "destructive" : "secondary"}>
                        {transfer.sourceAction === "DELETE" ? "Moved" : "Copied"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">{transfer.sourceProfile?.name || "Unknown"}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium">{transfer.targetProfile?.name || "Unknown"}</span>
                      <span className="text-gray-400">({transfer.targetUser?.email})</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Parent: {transfer.institutionParent?.childName || "Unknown"}
                    </p>
                  </div>
                  <div className="mt-3 md:mt-0 md:text-right">
                    <p className="text-sm text-gray-500">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {formatDate(transfer.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      By: {transfer.transferredByUser?.email || "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
