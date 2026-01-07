"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  GraduationCap,
  Users,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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
import { formatDate, getRoleDisplayName } from "@/lib/utils";
import type {
  Institution,
  InstitutionClass,
  InstitutionMember,
  UserSearchResult,
  InstitutionRole,
} from "@/types";

export default function InstitutionDetailPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const [institution, setInstitution] = React.useState<Institution | null>(null);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [members, setMembers] = React.useState<InstitutionMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Add Member Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<InstitutionRole>("TEACHER");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isAddingMember, setIsAddingMember] = React.useState(false);

  // Remove Member Modal
  const [removeMemberModal, setRemoveMemberModal] = React.useState<{
    open: boolean;
    member: InstitutionMember | null;
    isRemoving: boolean;
  }>({
    open: false,
    member: null,
    isRemoving: false,
  });

  const fetchData = React.useCallback(async () => {
    try {
      const [institutionData, classesData, membersData] = await Promise.all([
        api.getInstitution(institutionId),
        api.getClasses(institutionId),
        api.getInstitutionMembers(institutionId),
      ]);
      setInstitution(institutionData);
      setClasses(classesData);
      setMembers(membersData);
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

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      const results = await api.searchUserByEmail(searchEmail);
      setSearchResults(results);
    } catch (err) {
      console.error("Failed to search user:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setIsAddingMember(true);
    try {
      const newMember = await api.addInstitutionMember(institutionId, {
        userId: selectedUser.id,
        role: selectedRole,
      });
      setMembers((prev) => [...prev, newMember]);
      setIsAddMemberOpen(false);
      setSearchEmail("");
      setSearchResults([]);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberModal.member) return;

    setRemoveMemberModal((prev) => ({ ...prev, isRemoving: true }));
    try {
      await api.removeInstitutionMember(
        institutionId,
        removeMemberModal.member.userId
      );
      setMembers((prev) =>
        prev.filter((m) => m.userId !== removeMemberModal.member?.userId)
      );
      setRemoveMemberModal({ open: false, member: null, isRemoving: false });
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err instanceof Error ? err.message : "Failed to remove member");
      setRemoveMemberModal((prev) => ({ ...prev, isRemoving: false }));
    }
  };

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
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          Institution not found
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={institution.name}
        description={institution.description || "No description"}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Institutions", href: "/admin/institutions" },
          { label: institution.name },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Classes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Classes
            </CardTitle>
            <Badge variant="secondary">{classes.length} total</Badge>
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
                      {cls.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {cls.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {cls._count?.students || 0} students
                    </Badge>
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

        {/* Members Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <EmptyState
                title="No members"
                description="No members have been added to this institution yet."
                action={
                  <Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={member.user.picture}
                            name={member.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">
                              {member.user.name || member.user.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === "INSTITUTION_ADMIN"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {getRoleDisplayName(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRemoveMemberModal({
                              open: true,
                              member,
                              isRemoving: false,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Modal */}
      <Modal
        open={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setSearchEmail("");
          setSearchResults([]);
          setSelectedUser(null);
        }}
        title="Add Member"
        description="Search for a user by email to add them to this institution."
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
            />
            <Button onClick={handleSearchUser} isLoading={isSearching}>
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Search Results</p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedUser?.id === user.id
                      ? "border-primary-500 bg-primary-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Avatar src={user.picture} name={user.name} size="sm" />
                  <div>
                    <p className="font-medium">{user.name || "No name"}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <Select
              label="Role"
              options={[
                { value: "INSTITUTION_ADMIN", label: "Institution Admin" },
                { value: "TEACHER", label: "Teacher" },
              ]}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as InstitutionRole)}
            />
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false);
                setSearchEmail("");
                setSearchResults([]);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser}
              isLoading={isAddingMember}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Member Confirmation */}
      <ConfirmModal
        open={removeMemberModal.open}
        onClose={() =>
          setRemoveMemberModal({ open: false, member: null, isRemoving: false })
        }
        onConfirm={handleRemoveMember}
        title="Remove Member"
        description={`Are you sure you want to remove ${
          removeMemberModal.member?.user.name || removeMemberModal.member?.user.email
        } from this institution? They will lose access to all classes.`}
        confirmText="Remove"
        isDestructive
        isLoading={removeMemberModal.isRemoving}
      />
    </AdminLayout>
  );
}
