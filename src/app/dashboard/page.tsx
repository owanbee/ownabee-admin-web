"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, Building2, Users, KeyRound, FolderOpen, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useIsOperator } from "@/stores/authStore";
import { getRoleDisplayName } from "@/lib/utils";

export default function DashboardPage() {
  const { user, portalInfo } = useAuthStore();
  const isOperator = useIsOperator();

  const institutionMemberships = portalInfo?.institutionMemberships || [];
  const assignedClasses = portalInfo?.assignedClasses || [];

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.name || "User"}!`}
        description="Manage your classes, students, and portfolios from here."
      />

      {/* User Info Card */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your account information and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={isOperator ? "default" : "secondary"}>
                    {getRoleDisplayName(user?.globalRole || "USER")}
                  </Badge>
                  {institutionMemberships.map((membership) => (
                    <Badge key={membership.institutionId} variant="outline">
                      {getRoleDisplayName(membership.role)} @ {membership.institutionName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Classes */}
        <Link href="/classes">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">My Classes</CardTitle>
                  <CardDescription>View and manage your classes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {assignedClasses.length} classes accessible
                </span>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Portfolios */}
        <Link href="/classes">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Student Portfolios</CardTitle>
                  <CardDescription>Manage student portfolios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Select a class to view portfolios</span>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Admin: Institutions (Operator only) */}
        {isOperator && (
          <Link href="/admin/institutions">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-purple-100 p-3">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Institutions</CardTitle>
                    <CardDescription>Manage institutions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Create and manage institutions</span>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Admin: Members (Operator only) */}
        {isOperator && (
          <Link href="/admin/members">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-orange-100 p-3">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Members</CardTitle>
                    <CardDescription>Manage institution members</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Assign roles and manage access</span>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Admin: Student Codes (Operator only) */}
        {isOperator && (
          <Link href="/admin/student-codes">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-red-100 p-3">
                    <KeyRound className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Student Codes</CardTitle>
                    <CardDescription>Generate and manage codes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Create student registration codes</span>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </DashboardLayout>
  );
}
