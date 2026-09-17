import React from "react";

export function DatafastVerifiedBanner({ className = "w-full max-w-70" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src="/images/datafast-verified.png"
        alt="Powered by Datafast - Tarjetas aceptadas: Amex, Diners, Discover, Mastercard, Visa"
        className="h-auto w-full max-w-72.5 object-contain"
        onError={(e) => {
          // Fallback to official Datafast CDN URL if local image is missing
          (e.currentTarget as HTMLImageElement).src = "https://www.datafast.com.ec/images/verified.png";
        }}
      />
    </div>
  );
}

export function SecurityBadge() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-col items-center justify-center gap-2">
        <DatafastVerifiedBanner />
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-text-secondary">
        <svg className="h-4 w-4 shrink-0 text-status-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          <strong className="font-semibold text-foreground">Pago 100% Seguro y Encriptado (SSL 256-bit).</strong> Procesamiento oficial certificado por Datafast Ecuador.
        </span>
      </div>
    </div>
  );
}
