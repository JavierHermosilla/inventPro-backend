declare module "pdfmake/build/pdfmake" {
  import type { TDocumentDefinitions } from "pdfmake/interfaces";

  type PdfMakeDocument = {
    download: (filename?: string, callback?: () => void) => void;
    open: () => void;
    getBlob: (callback: (blob: Blob) => void) => void;
  };

  interface PdfMakeInstance {
    vfs: Record<string, string>;
    fonts?: Record<string, unknown>;
    createPdf: (definition: TDocumentDefinitions) => PdfMakeDocument;
  }

  const pdfMake: PdfMakeInstance;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  interface PdfFontsModule {
    pdfMake: { vfs: Record<string, string> };
  }

  const pdfFonts: PdfFontsModule;
  export default pdfFonts;
}
