"use client";

import * as React from "react";
import { Users, Plus, Trash2, UserCheck, User as UserIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
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
import { formatDate } from "@/lib/utils";
import { useIsInstitutionAdmin } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import type { InstitutionMember, UserSearchResult, InstitutionRole } from "@/types";

const roleLabels: Record<InstitutionRole, string> = {
  INSTITUTION_ADMIN: "Institution Admin",
  TEACHER: "Teacher",
};

const roleBadgeVariant: Record<InstitutionRole, "default" | "secondary"> = {
  INSTITUTION_ADMIN: "default",
  TEACHER: "secondary",
};

export default function MembersPage() {
  const router = useRouter();
  const isInstitutionAdmin = useIsInstitutionAdmin();

  const [members, setMembers] = React.useState<InstitutionMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Add member modal state
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [memberEmail, setMemberEmail] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<InstitutionRole>("TEACHER");
  const [searchResults, setSearchResults] = React.useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Remove member modal state
  const [memberToRemove, setMemberToRemove] = React.useState<InstitutionMember | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  // Redirect if not institution admin
  React.useEffect(() => {
    if (!isLoading && !isInstitutionAdmin) {
      router.push("/dashboard");
    }
  }, [isInstitutionAdmin, isLoading, router]);

  const fetchMembers = React.useCallback(async () => {
    try {
      const data = await api.getPortalMembers();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isInstitutionAdmin) {
      fetchMembers();
    }
  }, [isInstitutionAdmin, fetchMembers]);

  const handleSearchMember = async () => {
    if (!memberEmail) return;

    setIsSearching(true);
    try {
      const results = await api.searchUserByEmail(memberEmail);
      setSearchResults(results);
    } catch (err) {
      console.error("Failed to search user:", err);
      setError(err instanceof Error ? err.message : "Failed to search user");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setIsAdding(true);
    setError(null);

    try {
      await api.addPortalMember({ userId, role: selectedRole });
      setIsAddModalOpen(false);
      setMemberEmail("");
      setSearchResults([]);
      setSelectedRole("TEACHER");
      await fetchMembers();
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    setError(null);

    try {
      await api.removePortalMember(memberToRemove.userId);
      setMemberToRemove(null);
      await fetchMembers();
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingPage message="Loading members..." />
      </DashboardLayout>
    );
  }

  if (!isInstitutionAdmin) {
    return null;
  }

  const roleOptions = [
    { value: "TEACHER", label: "Teacher" },
    { value: "INSTITUTION_ADMIN", label: "Institution Admin" },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Institution Members"
        description="Manage members and their roles in your institution"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Members" }]}
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add members to your institution to get started."
          action={
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.user.picture}
                          name={member.user.name || member.user.email}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.name || member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{member.user.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant[member.role]}>
                        {roleLabels[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{formatDate(member.createdAt)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Member Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setMemberEmail("");
          setSearchResults([]);
          setSelectedRole("TEACHER");
        }}
        title="Add Member"
      >
        <div className="space-y-4">
          <Select
            label="Role"
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as InstitutionRole)}
          />

          <div className="flex gap-2">
            <Input
              label="Member Email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Enter email to search"
            />
            <Button onClick={handleSearchMember} isLoading={isSearching} className="mt-7">
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Search Results:</p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={user.picture} name={user.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{user.name || user.email}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddMember(user.id)} isLoading={isAdding}>
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <Modal
          open={!!memberToRemove}
          onClose={() => setMemberToRemove(null)}
          title="Remove Member"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove{" "}
              <strong>{memberToRemove.user.name || memberToRemove.user.email}</strong> from your
              institution?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setMemberToRemove(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveMember} isLoading={isRemoving}>
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
