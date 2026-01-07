"use client";

import * as React from "react";
import { KeyRound, Plus, Copy, Check, Ban, CheckCircle } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import {
  formatDate,
  generateStudentCodeDisplay,
  getStatusColor,
} from "@/lib/utils";
import type { StudentCode, InstitutionClass, Institution } from "@/types";

export default function StudentCodesPage() {
  const [codes, setCodes] = React.useState<StudentCode[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [filterInstitutionId, setFilterInstitutionId] = React.useState("");
  const [filterClassId, setFilterClassId] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [createMode, setCreateMode] = React.useState<"single" | "batch">("single");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [batchCount, setBatchCount] = React.useState(10);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdCodes, setCreatedCodes] = React.useState<StudentCode[]>([]);

  // Status change modal
  const [statusModal, setStatusModal] = React.useState<{
    open: boolean;
    code: StudentCode | null;
    action: "activate" | "deactivate";
    isProcessing: boolean;
  }>({
    open: false,
    code: null,
    action: "deactivate",
    isProcessing: false,
  });

  // Copy state
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const [codesData, classesData, institutionsData] = await Promise.all([
        api.getStudentCodes(filterClassId || undefined, filterStatus || undefined),
        api.getClasses(),
        api.getInstitutions(),
      ]);
      setCodes(codesData);
      setClasses(classesData);
      setInstitutions(institutionsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [filterClassId, filterStatus]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredClasses = filterInstitutionId
    ? classes.filter((cls) => cls.institutionId === filterInstitutionId)
    : classes;

  const handleCreateCodes = async () => {
    if (!selectedClassId) return;

    setIsCreating(true);
    setError(null);

    try {
      let newCodes: StudentCode[];
      if (createMode === "single") {
        const code = await api.createStudentCode({ classId: selectedClassId });
        newCodes = [code];
      } else {
        newCodes = await api.batchCreateStudentCodes({
          classId: selectedClassId,
          count: Math.min(batchCount, 60),
        });
      }

      setCreatedCodes(newCodes);
      setCodes((prev) => [...newCodes, ...prev]);
    } catch (err) {
      console.error("Failed to create codes:", err);
      setError(err instanceof Error ? err.message : "Failed to create codes");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreatedCodes([]);
    setSelectedClassId("");
    setBatchCount(10);
  };

  const handleStatusChange = async () => {
    if (!statusModal.code) return;

    setStatusModal((prev) => ({ ...prev, isProcessing: true }));

    try {
      let updatedCode: StudentCode;
      if (statusModal.action === "deactivate") {
        updatedCode = await api.deactivateStudentCode(statusModal.code.id);
      } else {
        updatedCode = await api.activateStudentCode(statusModal.code.id);
      }

      setCodes((prev) =>
        prev.map((c) => (c.id === updatedCode.id ? updatedCode : c))
      );
      setStatusModal({ open: false, code: null, action: "deactivate", isProcessing: false });
    } catch (err) {
      console.error("Failed to update code status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
      setStatusModal((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllCodes = async () => {
    const codesText = createdCodes
      .map((c) => generateStudentCodeDisplay(c.code))
      .join("\n");
    await navigator.clipboard.writeText(codesText);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading student codes..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Student Codes"
        description="Generate and manage student registration codes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Student Codes" },
        ]}
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Codes
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select
          options={[
            { value: "", label: "All Institutions" },
            ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
          ]}
          value={filterInstitutionId}
          onChange={(e) => {
            setFilterInstitutionId(e.target.value);
            setFilterClassId("");
          }}
          className="w-48"
        />
        <Select
          options={[
            { value: "", label: "All Classes" },
            ...filteredClasses.map((cls) => ({ value: cls.id, label: cls.name })),
          ]}
          value={filterClassId}
          onChange={(e) => setFilterClassId(e.target.value)}
          className="w-48"
        />
        <Select
          options={[
            { value: "", label: "All Status" },
            { value: "AVAILABLE", label: "Available" },
            { value: "USED", label: "Used" },
            { value: "DEACTIVATED", label: "Deactivated" },
          ]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        />
      </div>

      {codes.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No student codes"
          description="Generate student codes to allow students to join classes."
          action={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Codes
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                        {generateStudentCodeDisplay(code.code)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(code.code, code.id)}
                      >
                        {copiedId === code.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {code.class?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(code.status)}>
                      {code.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(code.createdAt)}</TableCell>
                  <TableCell>
                    {code.profile ? (
                      <span>{code.profile.name}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {code.status === "AVAILABLE" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setStatusModal({
                            open: true,
                            code,
                            action: "deactivate",
                            isProcessing: false,
                          })
                        }
                      >
                        <Ban className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    {code.status === "DEACTIVATED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setStatusModal({
                            open: true,
                            code,
                            action: "activate",
                            isProcessing: false,
                          })
                        }
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Codes Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Generate Student Codes"
        className="max-w-2xl"
      >
        {createdCodes.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {createdCodes.length} code(s) generated successfully
              </p>
              <Button variant="outline" size="sm" onClick={copyAllCodes}>
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border">
              {createdCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between border-b px-4 py-2 last:border-0"
                >
                  <code className="font-mono">
                    {generateStudentCodeDisplay(code.code)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(code.code, code.id)}
                  >
                    {copiedId === code.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCloseCreateModal}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={createMode === "single" ? "default" : "outline"}
                onClick={() => setCreateMode("single")}
              >
                Single Code
              </Button>
              <Button
                variant={createMode === "batch" ? "default" : "outline"}
                onClick={() => setCreateMode("batch")}
              >
                Batch Generate
              </Button>
            </div>

            <Select
              label="Class"
              options={classes.map((cls) => ({
                value: cls.id,
                label: `${cls.name} (${cls.institution?.name || "Unknown"})`,
              }))}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              placeholder="Select a class"
            />

            {createMode === "batch" && (
              <Input
                type="number"
                label="Number of Codes"
                value={batchCount}
                onChange={(e) =>
                  setBatchCount(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))
                }
                min={1}
                max={60}
              />
            )}

            {createMode === "batch" && (
              <p className="text-sm text-gray-500">
                Maximum 60 codes can be generated at once.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseCreateModal}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCodes}
                disabled={!selectedClassId}
                isLoading={isCreating}
              >
                Generate {createMode === "batch" ? `${batchCount} Codes` : "Code"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Change Confirmation */}
      <ConfirmModal
        open={statusModal.open}
        onClose={() =>
          setStatusModal({ open: false, code: null, action: "deactivate", isProcessing: false })
        }
        onConfirm={handleStatusChange}
        title={statusModal.action === "deactivate" ? "Deactivate Code" : "Activate Code"}
        description={
          statusModal.action === "deactivate"
            ? `Are you sure you want to deactivate code "${
                statusModal.code ? generateStudentCodeDisplay(statusModal.code.code) : ""
              }"? Students will not be able to use this code.`
            : `Are you sure you want to reactivate code "${
                statusModal.code ? generateStudentCodeDisplay(statusModal.code.code) : ""
              }"?`
        }
        confirmText={statusModal.action === "deactivate" ? "Deactivate" : "Activate"}
        isDestructive={statusModal.action === "deactivate"}
        isLoading={statusModal.isProcessing}
      />
    </AdminLayout>
  );
}
