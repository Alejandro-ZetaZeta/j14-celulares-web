"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ProductWithVariants, ProductVariant, CreditCardRate } from "@/types/database";
import FinancingSimulator from "@/components/catalog/FinancingSimulator";
import { insforgeBrowser } from "@/lib/insforge-browser";
import { getProductDisplayName } from "@/lib/product-display";
import AddToCartButton from "@/components/cart/AddToCartButton";

// Client component — owns only the interactive right column of the detail page.
// The image, breadcrumb, and outer layout are server-rendered in page.tsx.

interface ProductDetailClientProps {
  product: ProductWithVariants;
  rates: CreditCardRate[];
  whatsappNumber: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function BatteryGauge({ value }: { value: number }) {
  const color =
    value >= 80 ? "#34C759" : value >= 60 ? "#FF9F0A" : "#FF3B30";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-label={`Batería: ${value}%`}>
        {/* Track */}
        <circle cx="44" cy="44" r="36" stroke="#E5E5EA" strokeWidth="8" fill="none" />
        {/* Progress */}
        <motion.circle
          cx="44"
          cy="44"
          r="36"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          transform="rotate(-90 44 44)"
        />
        {/* Label */}
        <text x="44" y="48" textAnchor="middle" fontSize="18" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
          {value}%
        </text>
      </svg>
      <span className="text-[12px] text-[var(--text-tertiary)] font-medium">Batería</span>
    </div>
  );
}

export default function ProductDetailClient({ product, rates, whatsappNumber }: ProductDetailClientProps) {
  const variants = product.product_variants ?? [];

  // Group capacities and colors from available variants
  const capacities = [...new Set(variants.map((v) => v.capacity))];
  const [selectedCapacity, setSelectedCapacity] = useState(capacities[0] ?? "");

  const colorsForCapacity = [
    ...new Set(
      variants.filter((v) => v.capacity === selectedCapacity).map((v) => v.color)
    ),
  ];
  const [selectedColor, setSelectedColor] = useState(colorsForCapacity[0] ?? "");

  const selectedVariant: ProductVariant | undefined = variants.find(
    (v) => v.capacity === selectedCapacity && v.color === selectedColor
  );

  const [installmentMonths, setInstallmentMonths] = useState<number | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void insforgeBrowser.auth.getCurrentUser().then(async ({ data }) => {
      if (!data?.user || !active) return;
      const { data: profile } = await insforgeBrowser.database
        .from("user_profiles")
        .select("full_name, role")
        .eq("id", data.user.id)
        .eq("role", "client")
        .single();
      if (active && profile?.full_name) setCustomerName(profile.full_name);
    });
    return () => { active = false; };
  }, []);

  const isOpenBox = product.type === "open_box_iphone";
  const displayName = getProductDisplayName(product);

  // Build WhatsApp pre-filled message
  const variantLabel = `${selectedCapacity ? ` ${selectedCapacity}` : ""}${selectedColor ? ` en ${selectedColor}` : ""}`;
  const baseMessage = `Hola${customerName ? `, soy ${customerName}` : ""}. Me interesa el ${displayName}${variantLabel}. ¿Está disponible?`;
  const financingMessage =
    installmentMonths && installmentAmount
      ? ` Quiero financiar a ${installmentMonths} meses por aproximadamente ${formatPrice(installmentAmount)}/mes.`
      : "";
  const waMessage = encodeURIComponent(`${baseMessage}${financingMessage}`);
  const waUrl = `https://wa.me/${whatsappNumber}?text=${waMessage}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col justify-center"
    >
      <h1 className="text-display mb-2">{displayName}</h1>

      {/* Open Box battery gauge */}
      {isOpenBox && selectedVariant?.battery_condition !== null && selectedVariant?.battery_condition !== undefined && (
        <div className="mb-6">
          <BatteryGauge value={selectedVariant.battery_condition} />
        </div>
      )}

      {/* Price */}
      {selectedVariant && (
        <p className="text-[2rem] font-light text-[var(--text-primary)] mb-6">
          {formatPrice(selectedVariant.price)}
        </p>
      )}

      {/* Capacity selector */}
      {capacities.length > 0 && (
        <div className="mb-5">
          <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Capacidad
          </p>
          <div className="flex flex-wrap gap-2">
            {capacities.map((cap) => (
              <button
                key={cap}
                id={`capacity-${cap}`}
                onClick={() => {
                  setSelectedCapacity(cap);
                  // Auto-select first available color for this capacity
                  const cols = [...new Set(variants.filter((v) => v.capacity === cap).map((v) => v.color))];
                  setSelectedColor(cols[0] ?? "");
                }}
                className={`chip ${selectedCapacity === cap ? "active" : ""}`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color selector */}
      {colorsForCapacity.length > 0 && (
        <div className="mb-6">
          <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Color
          </p>
          <div className="flex flex-wrap gap-2">
            {colorsForCapacity.map((color) => (
              <button
                key={color}
                id={`color-${color.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setSelectedColor(color)}
                className={`chip ${selectedColor === color ? "active" : ""}`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock indicator */}
      {selectedVariant && (
        <div className="flex items-center gap-2 mb-8">
          <span
            className={`status-dot ${
              selectedVariant.stock > 5 ? "green" : selectedVariant.stock > 0 ? "amber" : "red"
            }`}
          />
          <span className="text-[14px] text-[var(--text-secondary)]">
            {selectedVariant.stock > 0
              ? `${selectedVariant.stock} ${selectedVariant.stock === 1 ? "unidad disponible" : "unidades disponibles"}`
              : "Sin stock"}
          </span>
        </div>
      )}

      {/* Financing simulator */}
      {product.allows_installments && selectedVariant && (
        <div className="mb-5">
          <FinancingSimulator
            price={selectedVariant.price}
            rates={rates}
            onTermsChange={(months, amount) => {
              setInstallmentMonths(months);
              setInstallmentAmount(amount);
            }}
          />
        </div>
      )}

      {/* WhatsApp CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="cta-whatsapp"
        className="btn-whatsapp w-full justify-center text-center mb-3"
         aria-label={`Consultar disponibilidad por WhatsApp del ${displayName}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        Consultar disponibilidad por WhatsApp
      </a>

      {selectedVariant && <div className="mb-3"><AddToCartButton product={product} variant={selectedVariant} /></div>}

      {(product.product_gifts ?? []).length > 0 && <section className="mb-6 rounded-[var(--radius-md)] border border-[var(--accent)]/20 bg-[var(--accent-light)] p-4" aria-label="Regalo incluido">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--accent)]">Incluye regalo</p>
        <ul className="mt-2 space-y-1 text-[14px] text-[var(--text-secondary)]">
          {(product.product_gifts ?? []).map((gift) => { const giftProduct = Array.isArray(gift.gift_product) ? gift.gift_product[0] : gift.gift_product; return giftProduct ? <li key={gift.gift_product_id}>+ {gift.quantity} × {giftProduct.brand} {giftProduct.model}</li> : null; })}
        </ul>
      </section>}

      <Link href="/catalogo" className="btn-secondary w-full justify-center text-center mb-20 sm:mb-3" id="back-to-catalog">
        ← Volver al catálogo
      </Link>
    </motion.div>
  );
}
