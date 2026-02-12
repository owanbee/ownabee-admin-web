import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  descriptionNode?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  descriptionNode,
  breadcrumbs,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              {crumb.href ? (
                <Link href={crumb.href} className="text-gray-500 hover:text-gray-700">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and action */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          {descriptionNode && <div className="mt-1">{descriptionNode}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
