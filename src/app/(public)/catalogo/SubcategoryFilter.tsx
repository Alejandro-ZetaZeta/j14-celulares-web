"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";

interface Subcategory {
  id: string;
  label: string;
}

interface SubcategoryFilterProps {
  subcategories: Subcategory[];
  activeId: string;
  seccion: string; // "iphone" | "android"
}

export default function SubcategoryFilter({
  subcategories,
  activeId,
  seccion,
}: SubcategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Optimistic state: instantly reflects the clicked chip before the server
  // responds, so the UI feels as fast as client-side filtering.
  const [optimisticActiveId, setOptimisticActiveId] = useOptimistic(activeId);

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("seccion", seccion);
    params.set("filtro", id);
    const url = `${pathname}?${params.toString()}`;

    startTransition(async () => {
      setOptimisticActiveId(id);
      router.push(url, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {subcategories.map((sub) => {
        const isActive = sub.id === optimisticActiveId;
        return (
          <button
            key={sub.id}
            onClick={() => handleSelect(sub.id)}
            className={`chip ${isActive ? "active" : ""}`}
            aria-pressed={isActive}
          >
            {sub.label}
          </button>
        );
      })}
    </div>
  );
}
