"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Image,
  FileText,
  Book,
  Building2,
  GraduationCap,
  UserCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmModal } from "@/components/ui/modal";
import { StudentSelectModal } from "@/components/modals/StudentSelectModal";
import { api } from "@/lib/api";
import { formatDate, isApiError } from "@/lib/utils";
import type {
  Portfolio,
  PortfolioContentType,
  Institution,
  InstitutionClass,
  Student,
} from "@/types";

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

function PortfoliosPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [portfolios, setPortfolios] = React.useState<Portfolio[]>([]);
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);

  const [filterInstitutionId, setFilterInstitutionId] = React.useState("");
  const [filterClassId, setFilterClassId] = React.useState("");
  const [filterStudentId, setFilterStudentId] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = React.useState(false);
  const [deleteModal, setDeleteModal] = React.useState<{
    open: boolean;
    portfolio: Portfolio | null;
    isDeleting: boolean;
  }>({
    open: false,
    portfolio: null,
    isDeleting: false,
  });

  // Initialize from URL params and fetch portfolios
  React.useEffect(() => {
    if (classes.length === 0 || isLoading) return; // Wait for initial data to load

    const institutionId = searchParams.get("institutionId");
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    let finalInstitutionId = institutionId;
    let finalClassId = classId;
    let finalStudentId = studentId;

    // If classId is provided but institutionId is not, find the institutionId from the class
    if (classId && !institutionId) {
      const selectedClass = classes.find((cls) => cls.id === classId);
      if (selectedClass) {
        finalInstitutionId = selectedClass.institutionId;
        setFilterInstitutionId(selectedClass.institutionId);
      }
    } else if (institutionId) {
      setFilterInstitutionId(institutionId);
    }

    if (classId) setFilterClassId(classId);
    if (studentId) setFilterStudentId(studentId);

    // Fetch portfolios with the URL params immediately
    const fetchWithUrlParams = async () => {
      try {
        const params:
          | { institutionId?: string; institutionClassId?: string; studentId?: string }
          | undefined =
          finalInstitutionId || finalClassId || finalStudentId
            ? {
                ...(finalInstitutionId && { institutionId: finalInstitutionId }),
                ...(finalClassId && { institutionClassId: finalClassId }),
                ...(finalStudentId && { studentId: finalStudentId }),
              }
            : undefined;
        const data = await api.getAllPortfolios(params);
        setPortfolios(data);
      } catch (err) {
        console.error("Failed to fetch portfolios:", err);
        setError(isApiError(err) ? err.message : "Failed to load portfolios");
      }
    };

    fetchWithUrlParams();
  }, [searchParams, classes, isLoading]);

  // Fetch initial data only
  React.useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch portfolios when filters change
  React.useEffect(() => {
    if (!isLoading) {
      fetchPortfolios();
    }
  }, [filterInstitutionId, filterClassId, filterStudentId]);

  // Fetch classes when institution changes
  React.useEffect(() => {
    if (filterInstitutionId) {
      const filtered = classes.filter((cls) => cls.institutionId === filterInstitutionId);
      // If current class is not in the filtered list, reset it
      if (filterClassId && !filtered.find((cls) => cls.id === filterClassId)) {
        setFilterClassId("");
      }
    }
  }, [filterInstitutionId, classes]);

  // Filter students is now handled by filtering the pre-loaded students list
  // No need to fetch students separately since we load all students initially

  const fetchInitialData = async () => {
    try {
      const [institutionsData, classesData, studentsData] = await Promise.all([
        api.getMyInstitutions(),
        api.getMyClasses(),
        api.getMyStudents(),
      ]);
      setInstitutions(institutionsData);
      setClasses(classesData);
      setStudents(studentsData.students);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setError(isApiError(err) ? err.message : "Failed to load data");
      setIsLoading(false);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const params:
        | { institutionId?: string; institutionClassId?: string; studentId?: string }
        | undefined =
        filterInstitutionId || filterClassId || filterStudentId
          ? {
              ...(filterInstitutionId && { institutionId: filterInstitutionId }),
              ...(filterClassId && { institutionClassId: filterClassId }),
              ...(filterStudentId && { studentId: filterStudentId }),
            }
          : undefined;
      const data = await api.getAllPortfolios(params);
      setPortfolios(data);
    } catch (err) {
      console.error("Failed to fetch portfolios:", err);
      setError(isApiError(err) ? err.message : "Failed to load portfolios");
    }
  };

  const handleFilterChange = (type: "institution" | "class" | "student", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "institution") {
      setFilterInstitutionId(value);
      setFilterClassId("");
      setFilterStudentId("");
      params.delete("classId");
      params.delete("studentId");
      if (value) {
        params.set("institutionId", value);
      } else {
        params.delete("institutionId");
      }
    } else if (type === "class") {
      setFilterClassId(value);
      setFilterStudentId("");
      params.delete("studentId");
      if (value) {
        params.set("classId", value);
      } else {
        params.delete("classId");
      }
    } else if (type === "student") {
      setFilterStudentId(value);
      if (value) {
        params.set("studentId", value);
      } else {
        params.delete("studentId");
      }
    }

    router.push(`/portfolios?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteModal.portfolio) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      await api.deletePortfolio(deleteModal.portfolio.id);
      setPortfolios((prev) => prev.filter((p) => p.id !== deleteModal.portfolio?.id));
      setDeleteModal({ open: false, portfolio: null, isDeleting: false });
    } catch (err) {
      console.error("Failed to delete portfolio:", err);
      setError(isApiError(err) ? err.message : "Failed to delete portfolio");
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

  const filteredClasses = filterInstitutionId
    ? classes.filter((cls) => cls.institutionId === filterInstitutionId)
    : classes;

  const filteredStudents = filterClassId
    ? students.filter((student) => student.institutionClassId === filterClassId)
    : students;

  const institutionOptions =
    institutions.length === 0
      ? [{ value: "", label: "No institutions available" }]
      : [
          { value: "", label: "All Institutions" },
          ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
        ];

  const classOptions =
    filteredClasses.length === 0
      ? [
          {
            value: "",
            label: filterInstitutionId ? "No classes available" : "Select institution first",
          },
        ]
      : [
          { value: "", label: "All Classes" },
          ...filteredClasses.map((cls) => ({ value: cls.id, label: cls.name })),
        ];

  const studentOptions =
    filteredStudents.length === 0
      ? [{ value: "", label: filterClassId ? "No students available" : "Select class first" }]
      : [
          { value: "", label: "All Students" },
          ...filteredStudents.map((student) => ({
            value: student.id,
            label: student.name,
          })),
        ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Portfolios"
        description="View and manage all portfolios"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Portfolios" }]}
        action={
          <Button onClick={() => setIsStudentModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Portfolio
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Select
          options={institutionOptions}
          value={filterInstitutionId}
          onChange={(e) => handleFilterChange("institution", e.target.value)}
        />
        <Select
          options={classOptions}
          value={filterClassId}
          onChange={(e) => handleFilterChange("class", e.target.value)}
          disabled={!filterInstitutionId}
        />
        <Select
          options={studentOptions}
          value={filterStudentId}
          onChange={(e) => handleFilterChange("student", e.target.value)}
          disabled={!filterClassId}
        />
      </div>

      {/* Portfolio Grid */}
      {portfolios.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No portfolios found"
          description={
            filterInstitutionId || filterClassId || filterStudentId
              ? "No portfolios match your current filters."
              : "No portfolios have been created yet."
          }
          action={
            <Button onClick={() => setIsStudentModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Portfolio
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Cover Image */}
              <Link href={`/portfolios/${portfolio.id}`}>
                <div className="aspect-video bg-gray-100 cursor-pointer">
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
              </Link>

              <CardContent className="p-4">
                <Link href={`/portfolios/${portfolio.id}`}>
                  <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-primary-600 cursor-pointer">
                    {portfolio.title}
                  </h3>
                </Link>

                {/* Profile Info */}
                {portfolio.profile && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <UserCircle className="h-3 w-3" />
                      <span>{portfolio.profile.name}</span>
                    </div>
                    {portfolio.profile.institutionClass && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <GraduationCap className="h-3 w-3" />
                        <span>{portfolio.profile.institutionClass.name}</span>
                      </div>
                    )}
                    {portfolio.profile.institution && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Building2 className="h-3 w-3" />
                        <span>{portfolio.profile.institution.name}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  Updated {formatDate(portfolio.updatedAt)}
                </p>

                {/* Content Type Badges */}
                {((portfolio.contentItems && portfolio.contentItems.length > 0) ||
                  (portfolio.contents && portfolio.contents.length > 0)) && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {Array.from(
                      new Set<PortfolioContentType>(
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
                    href={`/portfolios/${portfolio.id}/edit?studentId=${portfolio.profile?.student?.id || ""}`}
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

      {/* Student Select Modal */}
      <StudentSelectModal
        open={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        initialInstitutionId={filterInstitutionId}
        initialClassId={filterClassId}
        initialStudentId={filterStudentId}
        institutions={institutions}
        classes={classes}
        students={students}
      />

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

export default function PortfoliosPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingPage message="Loading portfolios..." />
        </DashboardLayout>
      }
    >
      <PortfoliosPageContent />
    </Suspense>
  );
}
