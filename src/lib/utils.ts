import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateStudentCodeDisplay(code: string): string {
  // Format code for display (e.g., XXXX-XXXX)
  if (code.length === 8) {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
  return code;
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "OPERATOR":
      return "Operator";
    case "INSTITUTION_ADMIN":
      return "Institution Admin";
    case "TEACHER":
      return "Teacher";
    case "USER":
      return "User";
    default:
      return role;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-800";
    case "USED":
      return "bg-blue-100 text-blue-800";
    case "DEACTIVATED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
