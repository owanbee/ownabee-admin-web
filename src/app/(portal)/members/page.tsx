"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, GraduationCap, Plus, Trash2, Search, UserPlus } from "lucide-react";
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
import { getRoleDisplayName, formatDate, isApiError } from "@/lib/utils";
import type {
  Institution,
  InstitutionClass,
  InstitutionMember,
  ClassTeacher,
  UserSearchResult,
  InstitutionRole,
} from "@/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type TabType = "members" | "teachers";

function MembersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [teachers, setTeachers] = useState<ClassTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  // Update query string when filters change
  const handleInstitutionChange = (institutionId: string) => {
    setSelectedInstitutionId(institutionId);
    // Reset class when institution changes
    setSelectedClassId("");

    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    router.push(`/members?${params.toString()}`);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);

    const params = new URLSearchParams();
    if (selectedInstitutionId) params.set("institutionId", selectedInstitutionId);
    if (classId) params.set("classId", classId);
    router.push(`/members?${params.toString()}`);
  };

  // Add Member Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<InstitutionRole>("TEACHER");
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Assign Teacher Modal
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  const [teacherSearchEmail, setTeacherSearchEmail] = useState("");
  const [teacherSearchResults, setTeacherSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<UserSearchResult | null>(null);
  const [isSearchingTeacher, setIsSearchingTeacher] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Remove Modal
  const [removeModal, setRemoveModal] = useState<{
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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Get URL params first
        const institutionIdParam = searchParams.get("institutionId");
        const classIdParam = searchParams.get("classId");

        const [institutionsData, classesData] = await Promise.all([
          api.getMyInstitutions(),
          api.getMyClasses(),
        ]);
        setInstitutions(institutionsData);
        setClasses(classesData);

        // Set from URL params only
        if (institutionIdParam) {
          setSelectedInstitutionId(institutionIdParam);
        }

        if (classIdParam) {
          setSelectedClassId(classIdParam);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError(isApiError(err) ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [searchParams]);

  // Fetch members when institution changes
  useEffect(() => {
    if (selectedInstitutionId && activeTab === "members") {
      api
        .getPortalMembers(selectedInstitutionId)
        .then(setMembers)
        .catch((err) => {
          console.error("Failed to fetch members:", err);
        });
    }
  }, [selectedInstitutionId, activeTab]);

  // Fetch teachers when class changes
  useEffect(() => {
    if (selectedClassId && activeTab === "teachers") {
      api
        .getPortalClassTeachers(selectedClassId)
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
      const results = await api.searchPortalUser(searchEmail);
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
      const results = await api.searchPortalUser(teacherSearchEmail);
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
      const newMember = await api.addPortalMember(selectedInstitutionId, {
        memberUserId: selectedUser.id,
        role: selectedRole,
      });
      setMembers((prev) => [...prev, newMember]);
      handleCloseAddMember();
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(
        isApiError(err)
          ? err.message
          : "Failed to add member. Only institution admin can add members."
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedClassId) return;

    setIsAssigning(true);
    try {
      const newTeacher = await api.assignPortalTeacher(selectedClassId, {
        teacherUserId: selectedTeacher.id,
      });
      setTeachers((prev) => [...prev, newTeacher]);
      handleCloseAssignTeacher();
    } catch (err) {
      console.error("Failed to assign teacher:", err);
      setError(
        isApiError(err)
          ? err.message
          : "Failed to assign teacher. User must be a member of the institution first."
      );
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
        await api.removePortalMember(member.userId, selectedInstitutionId);
        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      } else {
        const teacher = removeModal.item as ClassTeacher;
        await api.removePortalTeacher(selectedClassId, teacher.userId);
        setTeachers((prev) => prev.filter((t) => t.userId !== teacher.userId));
      }
      setRemoveModal({ open: false, type: "member", item: null, isRemoving: false });
    } catch (err) {
      console.error("Failed to remove:", err);
      setError(isApiError(err) ? err.message : "Failed to remove");
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
    <DashboardLayout>
      <PageHeader
        title="Member Management"
        description="Manage institution members and teacher assignments"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin" },
          { label: "Members" },
        ]}
      />

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

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
              <CardTitle className="whitespace-nowrap">Institution Members</CardTitle>
              <Select
                options={[
                  { value: "", label: "Select Institution" },
                  ...institutions.map((inst) => ({
                    value: inst.id,
                    label: inst.name,
                  })),
                ]}
                value={selectedInstitutionId}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={() => setIsAddMemberOpen(true)} disabled={!selectedInstitutionId}>
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
                          <Avatar src={member.user.picture} name={member.user.name} size="sm" />
                          <div>
                            <p className="font-medium">{member.user.name || member.user.email}</p>
                            <p className="text-sm text-gray-500">{member.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "INSTITUTION_ADMIN" ? "default" : "secondary"}
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
              <div className="flex gap-2">
                <Select
                  options={[
                    { value: "", label: "Select Institution" },
                    ...institutions.map((inst) => ({
                      value: inst.id,
                      label: inst.name,
                    })),
                  ]}
                  value={selectedInstitutionId}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className="w-48"
                />
                <Select
                  options={
                    selectedInstitutionId && filteredClasses.length === 0
                      ? [{ value: "", label: "No classes available" }]
                      : [
                          { value: "", label: "Select Class" },
                          ...filteredClasses.map((cls) => ({
                            value: cls.id,
                            label: cls.name,
                          })),
                        ]
                  }
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-48"
                  disabled={!selectedInstitutionId}
                />
              </div>
            </div>
            <Button onClick={() => setIsAssignTeacherOpen(true)} disabled={!selectedClassId}>
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
                  <Button onClick={() => setIsAssignTeacherOpen(true)} disabled={!selectedClassId}>
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
                          <Avatar src={teacher.user.picture} name={teacher.user.name} size="sm" />
                          <div>
                            <p className="font-medium">{teacher.user.name || teacher.user.email}</p>
                            <p className="text-sm text-gray-500">{teacher.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(teacher.createdAt)}</TableCell>
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
            <Button onClick={handleAddMember} disabled={!selectedUser} isLoading={isAdding}>
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
    </DashboardLayout>
  );
}

export default function MembersPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <LoadingPage message="Loading members..." />
        </DashboardLayout>
      }
    >
      <MembersPageContent />
    </Suspense>
  );
}
