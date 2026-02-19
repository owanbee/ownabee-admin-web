"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Institution, InstitutionClass, Student } from "@/types";

interface StudentSelectModalProps {
  open: boolean;
  onClose: () => void;
  initialInstitutionId?: string;
  initialClassId?: string;
  initialStudentId?: string;
  institutions: Institution[];
  classes: InstitutionClass[];
  students: Student[];
}

export function StudentSelectModal({
  open,
  onClose,
  initialInstitutionId = "",
  initialClassId = "",
  initialStudentId = "",
  institutions,
  classes,
  students,
}: StudentSelectModalProps) {
  const router = useRouter();

  const [selectedInstitutionId, setSelectedInstitutionId] = React.useState("");
  const [selectedClassId, setSelectedClassId] = React.useState("");
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);

  // Set initial values when modal opens
  React.useEffect(() => {
    if (open) {
      if (initialInstitutionId) setSelectedInstitutionId(initialInstitutionId);
      if (initialClassId) setSelectedClassId(initialClassId);
      if (initialStudentId) {
        const student = students.find((s) => s.id === initialStudentId);
        if (student) setSelectedStudent(student);
      }
    }
  }, [open, initialInstitutionId, initialClassId, initialStudentId, students]);

  const handleConfirm = () => {
    if (selectedStudent) {
      router.push(`/portfolios/new?studentId=${selectedStudent.id}`);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedInstitutionId("");
    setSelectedClassId("");
    setSelectedStudent(null);
    onClose();
  };

  // Filter classes by selected institution
  const filteredClasses = selectedInstitutionId
    ? classes.filter((cls) => cls.institutionId === selectedInstitutionId)
    : [];

  // Filter students by selected class
  const filteredStudents = selectedClassId
    ? students.filter((student) => student.institutionClassId === selectedClassId)
    : [];

  const institutionOptions =
    institutions.length === 0
      ? [{ value: "", label: "No institutions available" }]
      : [
          { value: "", label: "Select Institution" },
          ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
        ];

  const classOptions =
    filteredClasses.length === 0
      ? [
          {
            value: "",
            label: selectedInstitutionId ? "No classes available" : "Select institution first",
          },
        ]
      : [
          { value: "", label: "Select Class" },
          ...filteredClasses.map((cls) => ({ value: cls.id, label: cls.name })),
        ];

  const studentOptions =
    filteredStudents.length === 0
      ? [{ value: "", label: selectedClassId ? "No students available" : "Select class first" }]
      : [
          { value: "", label: "Select Student" },
          ...filteredStudents.map((student) => ({
            value: student.id,
            label: student.name,
          })),
        ];

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    const student = filteredStudents.find((s) => s.id === studentId) || null;
    setSelectedStudent(student);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Select Student for Portfolio">
      <div className="space-y-4">
        <Select
          label="Institution"
          options={institutionOptions}
          value={selectedInstitutionId}
          onChange={(e) => setSelectedInstitutionId(e.target.value)}
          required
        />

        <Select
          label="Class"
          options={classOptions}
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          disabled={!selectedInstitutionId}
          required
        />

        <Select
          label="Student"
          options={studentOptions}
          value={selectedStudent?.id || ""}
          onChange={handleStudentChange}
          disabled={!selectedClassId}
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedStudent}
            isLoading={isLoading}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
