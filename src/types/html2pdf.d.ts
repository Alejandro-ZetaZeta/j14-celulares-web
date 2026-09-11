declare module "html2pdf.js" {
  type PdfDoc = {
    internal: {
      getNumberOfPages(): number;
      pageSize: { getWidth(): number; getHeight(): number };
    };
    setPage(i: number): void;
    setGState(g: unknown): void;
    GState: new (o: Record<string, number>) => unknown;
    addImage(data: string, format: string, x: number, y: number, w: number, h: number): void;
    output(format: string): Blob;
  };

  interface Html2PdfWorker {
    set(options: Record<string, unknown>): Html2PdfWorker;
    from(element: HTMLElement): Html2PdfWorker;
    toPdf(): Html2PdfWorker;
    get(key: string): Promise<PdfDoc>;
    save(): Promise<void>;
  }

  const html2pdf: (options?: Record<string, unknown>) => Html2PdfWorker;
  export default html2pdf;
}