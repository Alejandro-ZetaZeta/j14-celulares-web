"use client";

import { Suspense } from "react";
import { Skeleton } from "boneyard-js/react";

function Bone({ className }: { className: string }) {
  return <span className={`block rounded-md bg-black/[0.08] ${className}`} aria-hidden="true" />;
}

function CatalogGridSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5" role="status" aria-label="Cargando catálogo">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="catalog-tile overflow-hidden">
          <div className="catalog-tile-image">
            <Bone className="absolute inset-0 h-full w-full rounded-none" />
          </div>
          <div className="p-4">
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-4 w-3/4" />
            <div className="mt-4 flex items-end justify-between gap-2">
              <div>
                <Bone className="h-2.5 w-10" />
                <Bone className="mt-1.5 h-5 w-20" />
              </div>
              <Bone className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogSkeleton() {
  return (
    <Suspense fallback={<CatalogGridSkeleton />}>
      <Skeleton name="catalog" loading animate="shimmer" fallback={<CatalogGridSkeleton />}>
        <CatalogGridSkeleton />
      </Skeleton>
    </Suspense>
  );
}