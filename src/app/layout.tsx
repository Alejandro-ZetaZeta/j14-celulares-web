import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Celulares J14",
  description:
    "Encuentra smartphones Android e iPhone sellados y Open Box al mejor precio. Consulta el estado de tu reparación en tiempo real. Servicio técnico especializado.",
  keywords: ["celulares", "smartphones", "iPhone", "Samsung", "servicio técnico", "reparación"],
  openGraph: {
    title: "Celulares J14",
    description: "Smartphones Android e iPhone. Catálogo actualizado y servicio técnico transparente.",
    type: "website",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
