"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Users, Trash2, UserCircle, Tablet, ExternalLink } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api";
import { formatDate, getRoleDisplayName } from "@/lib/utils";
import type {
  Institution,
  InstitutionClass,
  InstitutionMember,
  Student,
  SharedTablet,
} from "@/types";

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.id as string;

  const [institution, setInstitution] = React.useState<Institution | null>(null);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [members, setMembers] = React.useState<InstitutionMember[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [sharedTablets, setSharedTablets] = React.useState<SharedTablet[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Delete institution confirmation
  const [isDeleteInstitutionModalOpen, setIsDeleteInstitutionModalOpen] = React.useState(false);
  const [isDeletingInstitution, setIsDeletingInstitution] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [institutionData, classesData, membersData, studentsData, tabletsData] =
        await Promise.all([
          api.getInstitution(institutionId),
          api.getClasses(institutionId),
          api.getInstitutionMembers(institutionId),
          api.getStudents({ institutionId }),
          api.getSharedTablets({ institutionId }),
        ]);
      setInstitution(institutionData);
      setClasses(classesData);
      setMembers(membersData);
      setStudents(studentsData.students);
      setSharedTablets(tabletsData.tablets);
    } catch (err) {
      console.error("Failed to fetch institution data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [institutionId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteInstitution = async () => {
    setIsDeletingInstitution(true);
    setError(null);

    try {
      await api.deleteInstitution(institutionId);
      router.push("/admin/institutions");
    } catch (err) {
      console.error("Failed to delete institution:", err);
      setError(err instanceof Error ? err.message : "Failed to delete institution");
      setIsDeletingInstitution(false);
      setIsDeleteInstitutionModalOpen(false);
    }
  };

  const canDeleteInstitution =
    classes.length === 0 && students.length === 0 && sharedTablets.length === 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingPage message="Loading institution..." />
      </AdminLayout>
    );
  }

  if (!institution) {
    return (
      <AdminLayout>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">Institution not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={institution.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Institutions", href: "/admin/institutions" },
          { label: institution.name },
        ]}
        action={
          canDeleteInstitution && (
            <Button variant="destructive" onClick={() => setIsDeleteInstitutionModalOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Institution
            </Button>
          )
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Classes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Classes
            </CardTitle>
            <Link href={`/admin/classes?institutionId=${institutionId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Classes
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <EmptyState
                title="No classes"
                description="No classes have been created for this institution yet."
              />
            ) : (
              <div className="space-y-3">
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{cls.name}</p>
                      {cls.memo && <p className="text-sm text-gray-500 line-clamp-1">{cls.memo}</p>}
                    </div>
                    <Badge variant="secondary">{cls._count?.students || 0} students</Badge>
                  </div>
                ))}
                {classes.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{classes.length - 5} more classes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Students
            </CardTitle>
            <Link href={`/admin/students?institutionId=${institutionId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Students
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <EmptyState
                title="No students"
                description="No students have been created for this institution yet."
              />
            ) : (
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      {student.institutionClass && (
                        <p className="text-sm text-gray-500">{student.institutionClass.name}</p>
                      )}
                    </div>
                    {student.grade && <Badge variant="secondary">{student.grade}</Badge>}
                  </div>
                ))}
                {students.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{students.length - 5} more students
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared Tablets Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tablet className="h-5 w-5" />
              Shared Tablets
            </CardTitle>
            <Link href={`/admin/shared-tablets?institutionId=${institutionId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Tablets
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {sharedTablets.length === 0 ? (
              <EmptyState
                title="No shared tablets"
                description="No shared tablets have been created for this institution yet."
              />
            ) : (
              <div className="space-y-3">
                {sharedTablets.slice(0, 5).map((tablet) => (
                  <div
                    key={tablet.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{tablet.name}</p>
                      {tablet.institutionClassName && (
                        <p className="text-sm text-gray-500">{tablet.institutionClassName}</p>
                      )}
                    </div>
                    {tablet.username && (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        @{tablet.username}
                      </code>
                    )}
                  </div>
                ))}
                {sharedTablets.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{sharedTablets.length - 5} more tablets
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <Link href={`/admin/members?institutionId=${institutionId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Members
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <EmptyState
                title="No members"
                description="Go to Members menu to add admins and teachers for this institution."
              />
            ) : (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={member.user.picture} name={member.user.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === "INSTITUTION_ADMIN" ? "default" : "secondary"}>
                      {getRoleDisplayName(member.role)}
                    </Badge>
                  </div>
                ))}
                {members.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{members.length - 5} more members
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Institution Confirmation Modal */}
      <Modal
        open={isDeleteInstitutionModalOpen}
        onClose={() => setIsDeleteInstitutionModalOpen(false)}
        title="Delete Institution"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{institution.name}</strong>? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteInstitutionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInstitution}
              isLoading={isDeletingInstitution}
            >
              Delete Institution
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
