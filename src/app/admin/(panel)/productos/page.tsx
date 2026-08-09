import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/roles";
import { getAllProducts } from "@/lib/actions/admin-products";
import type { ProductWithVariants } from "@/types/database";
import AdminPanelSkeleton from "../AdminPanelSkeleton";

const TYPE_LABELS: Record<string, string> = {
  android: "Android",
  sealed_iphone: "iPhone Sellado",
  open_box_iphone: "iPhone Open Box",
};

async function ProductosContent() {
  await requireAdmin();
  const products = (await getAllProducts()) as ProductWithVariants[];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)]">Productos</h1>
          <p className="text-[var(--text-secondary)] mt-1">{products.length} productos en catálogo</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          id="admin-products-new"
          className="btn-primary"
        >
          + Nuevo Producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card-apple p-12 text-center hover:!transform-none">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-[17px] font-semibold text-[var(--text-primary)] mb-1">Sin productos</p>
          <p className="text-caption mb-5">Agrega tu primer producto al catálogo.</p>
          <Link href="/admin/productos/nuevo" className="btn-primary">
            Agregar producto
          </Link>
        </div>
      ) : (
        <div className="card-apple overflow-hidden hover:!transform-none hover:!box-shadow-none">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">Producto</th>
                <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)] hidden sm:table-cell">Tipo</th>
                <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)] hidden lg:table-cell">Inicio</th>
                <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">Variantes</th>
                <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">Stock Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock = (product.product_variants ?? []).reduce(
                  (acc, v) => acc + v.stock,
                  0
                );
                const isLow = totalStock > 0 && totalStock <= 3;

                return (
                  <tr
                    key={product.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--text-primary)]">{product.brand} {product.model}</p>
                    </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-[12px] bg-[var(--bg-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-full font-medium text-[var(--text-secondary)]">
                        {TYPE_LABELS[product.type] ?? product.type}
                      </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">{product.is_featured ? <span className="text-[12px] font-semibold text-[var(--accent)]">Destacado</span> : <span className="text-[12px] text-[var(--text-tertiary)]">—</span>}</td>
                    <td className="px-5 py-4 text-center text-[var(--text-secondary)]">
                      {product.product_variants?.length ?? 0}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-semibold ${isLow ? "text-[var(--status-amber)]" : totalStock === 0 ? "text-[var(--status-red)]" : "text-[var(--status-green)]"}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        id={`edit-product-${product.id}`}
                        className="text-[var(--accent)] hover:underline text-[13px] font-medium"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminProductosPage() {
  return (
    <Suspense fallback={<AdminPanelSkeleton variant="products" />}>
      <ProductosContent />
    </Suspense>
  );
}
