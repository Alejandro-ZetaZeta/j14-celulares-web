"use client";

import { Suspense } from "react";
import { Skeleton } from "boneyard-js/react";

type SkeletonVariant = "dashboard" | "products" | "tickets" | "financing" | "sales" | "shell";

function Bone({ className }: { className: string }) {
  return <span className={`block rounded-md bg-black/[0.08] ${className}`} aria-hidden="true" />;
}

function DashboardSkeleton() {
  return (
    <div className="p-8" aria-label="Cargando dashboard" role="status">
      <Bone className="h-8 w-40" />
      <Bone className="mt-3 h-4 w-64" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <Bone className="mb-4 h-7 w-7 rounded-lg" />
            <Bone className="mb-2 h-8 w-16" />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>
      <Bone className="mt-10 h-6 w-36" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Bone className="h-20 rounded-[var(--radius-lg)]" />
        <Bone className="h-20 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}

function TableSkeleton({ titleWidth, rows = 6 }: { titleWidth: string; rows?: number }) {
  return (
    <div className="p-8" aria-label="Cargando contenido" role="status">
      <div className="flex items-center justify-between">
        <div>
          <Bone className={`h-8 ${titleWidth}`} />
          <Bone className="mt-3 h-4 w-52" />
        </div>
        <Bone className="h-11 w-36 rounded-full" />
      </div>
      <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <Bone className="h-12 rounded-none" />
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 border-t border-[var(--border)] px-5 py-5">
            <Bone className="h-4 w-36" />
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-16" />
            <Bone className="ml-auto h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinancingSkeleton() {
  return (
    <div className="p-8" aria-label="Cargando financiamiento" role="status">
      <Bone className="h-8 w-52" />
      <Bone className="mt-3 h-4 w-72" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Bone className="h-52 rounded-[var(--radius-lg)]" />
        <Bone className="h-52 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}

function SalesSkeleton() {
  return (
    <div className="p-5 sm:p-8" aria-label="Cargando ventas" role="status">
      <Bone className="h-8 w-52" />
      <Bone className="mt-3 h-4 w-72" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Bone key={index} className="h-32 rounded-[var(--radius-lg)]" />)}
      </div>
      <Bone className="mt-8 h-96 rounded-[var(--radius-lg)]" />
    </div>
  );
}

function SkeletonContent({ variant }: { variant: SkeletonVariant }) {
  switch (variant) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "products":
      return <TableSkeleton titleWidth="w-36" />;
    case "tickets":
      return <TableSkeleton titleWidth="w-48" rows={5} />;
    case "financing":
      return <FinancingSkeleton />;
    case "sales":
      return <SalesSkeleton />;
    default:
      return <DashboardSkeleton />;
  }
}

export default function AdminPanelSkeleton({ variant = "dashboard" }: { variant?: SkeletonVariant }) {
  return (
    <Suspense fallback={<SkeletonContent variant={variant} />}>
      <Skeleton
        name={`admin-${variant}`}
        loading
        animate="shimmer"
        fallback={<SkeletonContent variant={variant} />}
      >
        <SkeletonContent variant={variant} />
      </Skeleton>
    </Suspense>
  );
}
