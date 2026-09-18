import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartProvider from "@/components/cart/CartProvider";
import AdModalLoader from "@/components/layout/AdModalLoader";
import { getSiteSettings } from "@/lib/site-settings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <CartProvider initialTaxRate={settings.taxRate}>
      <Suspense fallback={<header className="navbar-glass fixed top-0 left-0 right-0 h-12 z-50" />}>
        <Navbar whatsappNumber={settings.whatsappNumber} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer whatsappNumber={settings.whatsappNumber} />
      {/* Ad modal — non-blocking, appears after 600ms delay */}
      <Suspense fallback={null}>
        <AdModalLoader />
      </Suspense>
    </CartProvider>
  );
}

