"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BrandImg = { dataUrl: string; aspect: number };

function toDataUrl(src: string): Promise<string> {
  return fetch(src).then((r) => r.blob()).then(
    (blob) =>
      new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      }),
  );
}

function loadImage(src: string): Promise<BrandImg> {
  return toDataUrl(src).then(
    (dataUrl) =>
      new Promise<BrandImg>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ dataUrl, aspect: img.naturalWidth / img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      }),
  );
}

export default function PrintButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = `NotaVenta-${orderId}`;
    return () => {
      document.title = prev;
    };
  }, [orderId]);

  const downloadPdf = useCallback(async () => {
    setBusy(true);
    const element = document.getElementById("print-area");
    try {
      if (!element) return;
      const html2pdf = (await import("html2pdf.js")).default;

      const footer = element.querySelector<HTMLElement>(".print-footer");
      footerRef.current = footer;
      if (footer) footer.style.display = "none";

      const [left, right] = await Promise.all([loadImage("/BRAZOS_CRUZADOS.png"), loadImage("/J14Premium.png")]);

      const footerH = 16; // mm
      const opacity = 0.4;
      const filename = `NotaVenta-${orderId}.pdf`;

      const worker = html2pdf().set({
        margin: [12, 12, 24, 12],
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      });

      await worker.from(element).toPdf();
      const pdf = await worker.get("pdf");
      const pages = pdf.internal.getNumberOfPages();
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const gs = new pdf.GState({ opacity });
      for (let i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pdf.setGState(gs);
        pdf.addImage(left.dataUrl, "PNG", 0, pageH - footerH, footerH * left.aspect, footerH);
        pdf.addImage(right.dataUrl, "PNG", pageW - footerH * right.aspect, pageH - footerH, footerH * right.aspect, footerH);
        pdf.setGState(new pdf.GState({ opacity: 1 }));
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al generar el PDF:", err);
      alert("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      if (footerRef.current) footerRef.current.style.display = "";
      footerRef.current = null;
      setBusy(false);
    }
  }, [orderId]);

  const printReceipt = useCallback(() => {
    const prev = document.title;
    document.title = `NotaVenta-${orderId}`;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = prev;
      },
      { once: true },
    );
    window.print();
  }, [orderId]);

  return (
    <div className="mt-8 flex gap-3 print:hidden">
      <button type="button" onClick={printReceipt} className="btn-secondary">
        Imprimir
      </button>
      <button type="button" onClick={downloadPdf} disabled={busy} className="btn-primary">
        {busy ? "Generando PDF…" : "Descargar PDF"}
      </button>
    </div>
  );
}