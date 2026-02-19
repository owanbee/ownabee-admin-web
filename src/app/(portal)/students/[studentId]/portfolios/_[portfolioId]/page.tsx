"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FolderOpen, Image, FileText, Book, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmModal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate, isApiError } from "@/lib/utils";
import type { Portfolio, PortfolioContentType } from "@/types";

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

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const portfolioId = params.portfolioId as string;

  const [portfolio, setPortfolio] = React.useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteModal, setDeleteModal] = React.useState({
    open: false,
    isDeleting: false,
  });

  React.useEffect(() => {
    async function fetchPortfolio() {
      try {
        const data = await api.getPortalPortfolio(studentId, portfolioId);
        setPortfolio(data);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setError(isApiError(err) ? err.message : "Failed to load portfolio");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolio();
  }, [studentId, portfolioId]);

  const handleDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await api.deletePortfolio(portfolioId);
      router.push(`/students/${studentId}/portfolios`);
    } catch (err) {
      console.error("Failed to delete portfolio:", err);
      setError(isApiError(err) ? err.message : "Failed to delete portfolio");
      setDeleteModal({ open: false, isDeleting: false });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading portfolio..." />
      </DashboardLayout>
    );
  }

  if (!portfolio) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Portfolio not found</h2>
          <p className="text-gray-500 mb-6">The portfolio you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/students/${studentId}/portfolios`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolios
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={portfolio.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Students", href: "/students" },
          { label: "Student", href: `/students/${studentId}` },
          { label: "Portfolios", href: `/students/${studentId}/portfolios` },
          { label: portfolio.title },
        ]}
        action={
          <div className="flex gap-2">
            <Link
              href={`/portfolios/${portfolio.id}/edit?studentId=${portfolio.profile?.student?.id || ""}`}
            >
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => setDeleteModal({ open: true, isDeleting: false })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/students/${studentId}/portfolios`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Cover Image */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="aspect-video bg-gray-100">
            {portfolio.coverImage ? (
              <img
                src={portfolio.coverImage}
                alt={portfolio.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FolderOpen className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Portfolio Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-600 min-w-[100px]">Title:</span>
              <span className="text-sm text-gray-900">{portfolio.title}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-600 min-w-[100px]">Created:</span>
              <span className="text-sm text-gray-900">{formatDate(portfolio.createdAt)}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-gray-600 min-w-[100px]">Updated:</span>
              <span className="text-sm text-gray-900">{formatDate(portfolio.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Content Items
            {portfolio.contentItems && (
              <Badge variant="secondary">{portfolio.contentItems.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!portfolio.contentItems || portfolio.contentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No content items in this portfolio yet.
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.contentItems
                .sort((a, b) => a.order - b.order)
                .map((item, index) => {
                  const Icon = contentTypeIcons[item.type];
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {item.title || `${contentTypeLabels[item.type]} ${index + 1}`}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {contentTypeLabels[item.type]}
                          </Badge>
                        </div>
                        {item.type === "IMAGE" && item.thumbnailUrl && (
                          <div className="mt-2">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title || "Content"}
                              className="h-20 w-20 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">Order: {item.order}</div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, isDeleting: false })}
        onConfirm={handleDelete}
        title="Delete Portfolio"
        description={`Are you sure you want to delete "${portfolio.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteModal.isDeleting}
      />
    </DashboardLayout>
  );
}
