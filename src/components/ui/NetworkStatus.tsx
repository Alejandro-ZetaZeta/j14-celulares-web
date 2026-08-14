"use client";

import { useEffect, useState } from "react";

export default function NetworkStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-[var(--radius-md)] border border-[#F2C66D] bg-[#FFF8E7] px-4 py-3 text-[#684B09] shadow-[var(--shadow-lg)]"
      role="status"
      aria-live="assertive"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FDECC5] text-lg" aria-hidden="true">
        !
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">Sin conexión a internet</p>
        <p className="text-xs text-[#84672B]">Revisa tu red. Intentaremos reconectar automáticamente.</p>
      </div>
    </div>
  );
}
