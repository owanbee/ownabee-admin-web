"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FolderOpen, Plus, Pencil, Trash2, Image, FileText, Book, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmModal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Portfolio, PortfolioContentType, Student } from "@/types";

const contentTypeIcons: Record<PortfolioContentType, React.ElementType> = {
  IMAGE: Image,
  PDF: FileText,
  AUDIOBOOK: Book,
};

const contentTypeLabels: Record<PortfolioContentType, string> = {
  IMAGE: "Image",
  PDF: "PDF",
  AUDIOBOOK: "Audiobook",
};

export default function StudentPortfoliosPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [student, setStudent] = React.useState<Student | null>(null);
  const [portfolios, setPortfolios] = React.useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteModal, setDeleteModal] = React.useState<{
    open: boolean;
    portfolio: Portfolio | null;
    isDeleting: boolean;
  }>({
    open: false,
    portfolio: null,
    isDeleting: false,
  });

  const fetchData = React.useCallback(async () => {
    try {
      const [studentData, portfoliosData] = await Promise.all([
        api.getPortalStudent(studentId),
        api.getStudentPortfolios(studentId),
      ]);
      setStudent(studentData);
      setPortfolios(portfoliosData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPortfolios = React.useCallback(async () => {
    try {
      const data = await api.getStudentPortfolios(studentId);
      setPortfolios(data);
    } catch (err) {
      console.error("Failed to fetch portfolios:", err);
      setError(err instanceof Error ? err.message : "Failed to load portfolios");
    }
  }, [studentId]);

  const handleDelete = async () => {
    if (!deleteModal.portfolio) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await api.deletePortfolio(deleteModal.portfolio.id);
      setPortfolios((prev) => prev.filter((p) => p.id !== deleteModal.portfolio?.id));
      setDeleteModal({ open: false, portfolio: null, isDeleting: false });
    } catch (err) {
      console.error("Failed to delete portfolio:", err);
      setError(err instanceof Error ? err.message : "Failed to delete portfolio");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading portfolios..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Student Portfolios"
        descriptionNode={
          student ? (
            <div className="flex items-center gap-2 text-base font-medium text-gray-700">
              <User className="h-4 w-4" />
              <span>{student.name}</span>
              {student.studentNumber && (
                <span className="text-sm text-gray-500">({student.studentNumber})</span>
              )}
            </div>
          ) : (
            "View and manage portfolios for this student"
          )
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Students", href: "/students" },
          { label: student?.name || "Portfolios" },
        ]}
        action={
          <Link href={`/portfolios/new?studentId=${studentId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </Link>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {portfolios.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No portfolios yet"
          description="Create the first portfolio for this student."
          action={
            <Link href={`/portfolios/new?studentId=${studentId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Portfolio
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="overflow-hidden">
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100">
                {portfolio.coverImage || portfolio.coverUrl ? (
                  <img
                    src={portfolio.coverImage || portfolio.coverUrl}
                    alt={portfolio.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{portfolio.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Updated {formatDate(portfolio.updatedAt)}
                </p>

                {/* Content Type Badges */}
                {((portfolio.contentItems && portfolio.contentItems.length > 0) ||
                  (portfolio.contents && portfolio.contents.length > 0)) && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {Array.from(
                      new Set(
                        (portfolio.contentItems || portfolio.contents || []).map(
                          (item) => item.type
                        )
                      )
                    ).map((type) => {
                      const Icon = contentTypeIcons[type];
                      return (
                        <Badge key={type} variant="secondary" className="text-xs">
                          <Icon className="mr-1 h-3 w-3" />
                          {contentTypeLabels[type]}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/portfolios/${portfolio.id}/edit?studentId=${studentId}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDeleteModal({
                        open: true,
                        portfolio,
                        isDeleting: false,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, portfolio: null, isDeleting: false })}
        onConfirm={handleDelete}
        title="Delete Portfolio"
        description={`Are you sure you want to delete "${deleteModal.portfolio?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteModal.isDeleting}
      />
    </DashboardLayout>
  );
}
