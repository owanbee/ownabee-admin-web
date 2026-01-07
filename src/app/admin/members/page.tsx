"use client";

import * as React from "react";
import {
  Users,
  Building2,
  School,
  Plus,
  Trash2,
  Search,
  UserPlus,
  GraduationCap,
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
import { getRoleDisplayName, formatDate } from "@/lib/utils";
import type {
  Institution,
  InstitutionClass,
  InstitutionMember,
  ClassTeacher,
  UserSearchResult,
  InstitutionRole,
} from "@/types";

type TabType = "members" | "teachers";

export default function MembersPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("members");
  const [institutions, setInstitutions] = React.useState<Institution[]>([]);
  const [classes, setClasses] = React.useState<InstitutionClass[]>([]);
  const [members, setMembers] = React.useState<InstitutionMember[]>([]);
  const [teachers, setTeachers] = React.useState<ClassTeacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [selectedInstitutionId, setSelectedInstitutionId] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");

  // Add Member Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<InstitutionRole>("TEACHER");
  const [isSearching, setIsSearching] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);

  // Assign Teacher Modal
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = React.useState(false);
  const [teacherSearchEmail, setTeacherSearchEmail] = React.useState("");
  const [teacherSearchResults, setTeacherSearchResults] = React.useState<UserSearchResult[]>([]);
  const [selectedTeacher, setSelectedTeacher] = React.useState<UserSearchResult | null>(null);
  const [isSearchingTeacher, setIsSearchingTeacher] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Remove Modal
  const [removeModal, setRemoveModal] = React.useState<{
    open: boolean;
    type: "member" | "teacher";
    item: InstitutionMember | ClassTeacher | null;
    isRemoving: boolean;
  }>({
    open: false,
    type: "member",
    item: null,
    isRemoving: false,
  });

  const fetchInitialData = React.useCallback(async () => {
    try {
      const [institutionsData, classesData] = await Promise.all([
        api.getInstitutions(),
        api.getClasses(),
      ]);
      setInstitutions(institutionsData);
      setClasses(classesData);

      if (institutionsData.length > 0 && institutionsData[0]) {
        setSelectedInstitutionId(institutionsData[0].id);
      }
      if (classesData.length > 0 && classesData[0]) {
        setSelectedClassId(classesData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch members when institution changes
  React.useEffect(() => {
    if (selectedInstitutionId && activeTab === "members") {
      api.getInstitutionMembers(selectedInstitutionId)
        .then(setMembers)
        .catch((err) => {
          console.error("Failed to fetch members:", err);
        });
    }
  }, [selectedInstitutionId, activeTab]);

  // Fetch teachers when class changes
  React.useEffect(() => {
    if (selectedClassId && activeTab === "teachers") {
      api.getClassTeachers(selectedClassId)
        .then(setTeachers)
        .catch((err) => {
          console.error("Failed to fetch teachers:", err);
        });
    }
  }, [selectedClassId, activeTab]);

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

  const handleSearchTeacher = async () => {
    if (!teacherSearchEmail.trim()) return;

    setIsSearchingTeacher(true);
    try {
      const results = await api.searchUserByEmail(teacherSearchEmail);
      setTeacherSearchResults(results);
    } catch (err) {
      console.error("Failed to search user:", err);
    } finally {
      setIsSearchingTeacher(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedInstitutionId) return;

    setIsAdding(true);
    try {
      const newMember = await api.addInstitutionMember(selectedInstitutionId, {
        userId: selectedUser.id,
        role: selectedRole,
      });
      setMembers((prev) => [...prev, newMember]);
      handleCloseAddMember();
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedClassId) return;

    setIsAssigning(true);
    try {
      const newTeacher = await api.assignTeacher(selectedClassId, {
        userId: selectedTeacher.id,
      });
      setTeachers((prev) => [...prev, newTeacher]);
      handleCloseAssignTeacher();
    } catch (err) {
      console.error("Failed to assign teacher:", err);
      setError(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!removeModal.item) return;

    setRemoveModal((prev) => ({ ...prev, isRemoving: true }));

    try {
      if (removeModal.type === "member") {
        const member = removeModal.item as InstitutionMember;
        await api.removeInstitutionMember(selectedInstitutionId, member.userId);
        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      } else {
        const teacher = removeModal.item as ClassTeacher;
        await api.unassignTeacher(selectedClassId, teacher.userId);
        setTeachers((prev) => prev.filter((t) => t.userId !== teacher.userId));
      }
      setRemoveModal({ open: false, type: "member", item: null, isRemoving: false });
    } catch (err) {
      console.error("Failed to remove:", err);
      setError(err instanceof Error ? err.message : "Failed to remove");
      setRemoveModal((prev) => ({ ...prev, isRemoving: false }));
    }
  };

  const handleCloseAddMember = () => {
    setIsAddMemberOpen(false);
    setSearchEmail("");
    setSearchResults([]);
    setSelectedUser(null);
  };

  const handleCloseAssignTeacher = () => {
    setIsAssignTeacherOpen(false);
    setTeacherSearchEmail("");
    setTeacherSearchResults([]);
    setSelectedTeacher(null);
  };

  const filteredClasses = selectedInstitutionId
    ? classes.filter((cls) => cls.institutionId === selectedInstitutionId)
    : classes;

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
        title="Member Management"
        description="Manage institution members and teacher assignments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Members" },
        ]}
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="h-4 w-4" />
          Institution Members
        </button>
        <button
          onClick={() => setActiveTab("teachers")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "teachers"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Class Teachers
        </button>
      </div>

      {activeTab === "members" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Institution Members</CardTitle>
              <Select
                options={institutions.map((inst) => ({
                  value: inst.id,
                  label: inst.name,
                }))}
                value={selectedInstitutionId}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              onClick={() => setIsAddMemberOpen(true)}
              disabled={!selectedInstitutionId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members"
                description="Add members to this institution to grant them access."
                action={
                  <Button
                    onClick={() => setIsAddMemberOpen(true)}
                    disabled={!selectedInstitutionId}
                  >
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
                    <TableHead>Added</TableHead>
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
                      <TableCell>{formatDate(member.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRemoveModal({
                              open: true,
                              type: "member",
                              item: member,
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
      )}

      {activeTab === "teachers" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Class Teachers</CardTitle>
              <Select
                options={filteredClasses.map((cls) => ({
                  value: cls.id,
                  label: `${cls.name} (${cls.institution?.name || "Unknown"})`,
                }))}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-64"
              />
            </div>
            <Button
              onClick={() => setIsAssignTeacherOpen(true)}
              disabled={!selectedClassId}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Teacher
            </Button>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No teachers assigned"
                description="Assign teachers to this class to let them manage student portfolios."
                action={
                  <Button
                    onClick={() => setIsAssignTeacherOpen(true)}
                    disabled={!selectedClassId}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Teacher
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={teacher.user.picture}
                            name={teacher.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">
                              {teacher.user.name || teacher.user.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {teacher.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(teacher.assignedAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRemoveModal({
                              open: true,
                              type: "teacher",
                              item: teacher,
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
      )}

      {/* Add Member Modal */}
      <Modal
        open={isAddMemberOpen}
        onClose={handleCloseAddMember}
        title="Add Institution Member"
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
              <Search className="h-4 w-4" />
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
            <Button variant="outline" onClick={handleCloseAddMember}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser}
              isLoading={isAdding}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal
        open={isAssignTeacherOpen}
        onClose={handleCloseAssignTeacher}
        title="Assign Teacher to Class"
        description="Search for a user by email to assign them as a teacher for this class."
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={teacherSearchEmail}
              onChange={(e) => setTeacherSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchTeacher()}
            />
            <Button onClick={handleSearchTeacher} isLoading={isSearchingTeacher}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {teacherSearchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Search Results</p>
              {teacherSearchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedTeacher(user)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedTeacher?.id === user.id
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

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAssignTeacher}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignTeacher}
              disabled={!selectedTeacher}
              isLoading={isAssigning}
            >
              Assign Teacher
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        open={removeModal.open}
        onClose={() =>
          setRemoveModal({ open: false, type: "member", item: null, isRemoving: false })
        }
        onConfirm={handleRemove}
        title={removeModal.type === "member" ? "Remove Member" : "Unassign Teacher"}
        description={
          removeModal.type === "member"
            ? `Are you sure you want to remove this member from the institution? They will lose access to all classes.`
            : `Are you sure you want to unassign this teacher from the class?`
        }
        confirmText={removeModal.type === "member" ? "Remove" : "Unassign"}
        isDestructive
        isLoading={removeModal.isRemoving}
      />
    </AdminLayout>
  );
}
