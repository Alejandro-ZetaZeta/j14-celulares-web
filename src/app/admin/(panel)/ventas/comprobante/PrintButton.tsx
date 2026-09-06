"use client";

export default function PrintButton() {
  return <div className="mt-8 print:hidden"><button type="button" onClick={() => window.print()} className="btn-primary">Imprimir</button></div>;
}