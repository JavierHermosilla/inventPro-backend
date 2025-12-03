
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { easeOut, motion } from "framer-motion";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfMakeFonts from "pdfmake/build/vfs_fonts";
import type { Content, TableCell, TableLayout, TDocumentDefinitions } from "pdfmake/interfaces";
import { confirmAction, showError, showSuccess } from "../lib/alerts";
import {
  ordersApi,
  type OrderSnapshot,
  allowedStatusTransitions,
  statusLabels,
  formatCurrencyCLP,
  formatDateCL,
  formatRut,
  calcVatBreakdown,
} from "../lib/ordersApi";
import { clientsApi, type ClientItem } from "../lib/clientsApi";
import { productsApi, type ProductItem } from "../lib/productsApi";

type ViewMode = "list" | "detail" | "create";

type OrderFormLine = {
  id: string;
  productId: string;
  quantity: number;
};

type ClientInfo = {
  name: string | null;
  rut: string | null;
  address?: string | null;
};

type PdfDocumentFactory = (documentDefinition: TDocumentDefinitions) => { download: (fileName?: string) => void };

type PdfMakeInstance = {
  createPdf: PdfDocumentFactory;
  default?: PdfMakeInstance;
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  vfs?: Record<string, string>;
  fonts?: Record<string, unknown>;
};

const buildTempId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `line-${Math.random().toString(36).slice(2, 10)}`;

const sanitizeRutValue = (value: string) => value.replace(/\./g, "").trim().toUpperCase();

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === "object" && err !== null) {
    const maybeResponse = (err as {
      response?: { data?: { message?: unknown; errors?: Array<{ message?: unknown }> } };
    }).response;
    if (Array.isArray(maybeResponse?.data?.errors)) {
      const first = maybeResponse.data.errors.find(
        (item) => typeof item?.message === "string" && item.message.trim().length > 0,
      );
      if (first?.message) {
        return String(first.message);
      }
    }
    const message = maybeResponse?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  return fallback;
};

const statusToneClasses: Record<
  (typeof statusLabels)[keyof typeof statusLabels]["tone"],
  string
> = {
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  info: "border border-blue-200 bg-blue-50 text-blue-700",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border border-red-200 bg-red-50 text-red-600",
};

const skeletonStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-cell {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%);
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;
}
`;

const createEmptyLine = (): OrderFormLine => ({
  id: buildTempId(),
  productId: "",
  quantity: 1,
});

const stringLowerIncludes = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.toLowerCase());

const formatOrderCode = (index: number, total: number) => `OC-${String(total - index).padStart(3, "0")}`;

const pdfMakeRuntime: PdfMakeInstance =
  (pdfMake as unknown as PdfMakeInstance).default ?? (pdfMake as unknown as PdfMakeInstance);

const pdfVfs =
  (pdfMakeFonts as unknown as { pdfMake?: { vfs?: Record<string, string> } }).pdfMake?.vfs ??
  (pdfMakeFonts as unknown as { vfs?: Record<string, string> }).vfs ??
  pdfMakeRuntime.vfs;

if (typeof pdfMakeRuntime.addVirtualFileSystem === "function" && pdfVfs) {
  pdfMakeRuntime.addVirtualFileSystem(pdfVfs);
} else if (pdfVfs) {
  pdfMakeRuntime.vfs = pdfVfs;
}

pdfMakeRuntime.fonts = pdfMakeRuntime.fonts ?? {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const ORDER_PDF_COLORS = {
  primary: "#1d4ed8",
  dark: "#0f172a",
  text: "#0f172a",
  muted: "#475569",
  border: "#cbd5f5",
  background: "#f8fafc",
};

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

const buildBoletaDefinition = (order: OrderSnapshot, clientInfo: ClientInfo): TDocumentDefinitions => {
  const emissionDate = formatDateCL(order.createdAt);
  const clientName = clientInfo.name ?? "Cliente no informado";
  const clientRut = formatRut(clientInfo.rut ?? null);
  const docFolio = `BL-${shortId(order.id)}`;

  const linesBody: TableCell[][] = [];
  linesBody.push([
    { text: "CODIGO", style: "boletaHeader" },
    { text: "DESCRIPCION", style: "boletaHeader" },
    { text: "VALOR", style: "boletaHeader", alignment: "right" },
    { text: "DESC.", style: "boletaHeader", alignment: "right" },
  ]);
  linesBody.push([
    { text: "CANTIDAD UNIDAD X PRECIO", colSpan: 4, style: "boletaSubHeader", alignment: "center" },
    { text: "", style: "boletaSubHeader" },
    { text: "", style: "boletaSubHeader" },
    { text: "", style: "boletaSubHeader" },
  ]);
  order.items.forEach((item, index) => {
    linesBody.push([
      { text: String(index + 1).padStart(4, "0"), style: "boletaCell" },
      { text: `${item.productName}${item.productSku ? `\n${item.productSku}` : ""}`, style: "boletaCell" },
      { text: formatCurrencyCLP(item.unitPrice), style: "boletaCell", alignment: "right" },
      { text: "-", style: "boletaCell", alignment: "right" },
    ]);
  });

  return {
    info: { title: `BOLETA ELECTRONICA ${docFolio}`, author: "InventPro" },
    pageSize: "A4",
    pageMargins: [36, 36, 36, 54],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#111827" },
    content: [
      {
        stack: [
          { text: "InventPro SpA", style: "boletaTitle" },
          { text: "RUT: 76.543.210-9", style: "boletaMeta" },
          { text: "DIRECCION: Av. Apoquindo 1234, Las Condes, Santiago", style: "boletaMeta" },
          { text: "GIRO: Servicios de software e inventarios", style: "boletaMeta" },
          { text: "TELEFONO: +56 2 2345 6789", style: "boletaMeta" },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        stack: [
          { text: "BOLETA ELECTRONICA", style: "boletaDocTitle" },
          { text: docFolio, style: "boletaDocTitle" },
          { text: "S.I.I. SANTIAGO", style: "boletaMeta" },
          { text: `FECHA EMISION: ${emissionDate}`, style: "boletaMeta" },
        ],
        alignment: "center",
        margin: [0, 0, 0, 16],
      },
      {
        stack: [
          { text: "Receptor", style: "boletaSection" },
          { text: `Nombre: ${clientName}`, style: "boletaMeta" },
          { text: `RUT: ${clientRut}`, style: "boletaMeta" },
          { text: `Medio de Pago: Efectivo`, style: "boletaMeta" },
        ],
        margin: [0, 0, 0, 12],
      },
      { text: "-----------------------------------------------------------------", style: "boletaSeparator" },
      {
        table: {
          headerRows: 2,
          widths: ["auto", "*", "auto", "auto"],
          body: linesBody,
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        margin: [0, 6, 0, 6],
      },
      { text: "-----------------------------------------------------------------", style: "boletaSeparator" },
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            table: {
              widths: ["auto", "auto"],
              body: [
                [{ text: "SUB TOTAL", style: "boletaTotalsLabel" }, { text: formatCurrencyCLP(order.subtotal), style: "boletaTotalsValue" }],
                [{ text: "IVA 19%", style: "boletaTotalsLabel" }, { text: formatCurrencyCLP(order.iva), style: "boletaTotalsValue" }],
                [{ text: "TOTAL", style: "boletaTotalsStrong" }, { text: formatCurrencyCLP(order.totalWithTax), style: "boletaTotalsStrong" }],
              ],
            },
            layout: "noBorders",
          },
        ],
        margin: [0, 8, 0, 12],
      },
      { text: "-----------------------------------------------------------------", style: "boletaSeparator" },
      {
        stack: [
          {
            canvas: [
              { type: "rect", x: 0, y: 0, w: 300, h: 70, color: "#0f172a20" },
              { type: "line", x1: 0, y1: 35, x2: 300, y2: 35, lineWidth: 0.5, lineColor: "#0f172a40" },
            ],
            margin: [0, 8, 0, 4],
          },
          { text: "Timbre Electronico SII", style: "boletaMeta", alignment: "center" },
        ],
        alignment: "center",
      },
    ],
    styles: {
      boletaTitle: { fontSize: 12, bold: true },
      boletaMeta: { fontSize: 9 },
      boletaDocTitle: { fontSize: 12, bold: true, margin: [0, 1, 0, 1] },
      boletaSection: { fontSize: 10, bold: true, margin: [0, 4, 0, 2] },
      boletaHeader: { fontSize: 9, bold: true, margin: [0, 2, 0, 2] },
      boletaSubHeader: { fontSize: 8, italics: true, margin: [0, 0, 0, 2] },
      boletaCell: { fontSize: 9, margin: [0, 2, 0, 2] },
      boletaSeparator: { fontSize: 10, alignment: "center", margin: [0, 4, 0, 4] },
      boletaTotalsLabel: { fontSize: 9 },
      boletaTotalsValue: { fontSize: 9, alignment: "right" },
      boletaTotalsStrong: { fontSize: 10, bold: true, alignment: "right" },
    },
  };
};

const buildOrderPdfDefinition = (
  order: OrderSnapshot,
  docType: "boleta" | "factura",
  clientInfo: ClientInfo,
): TDocumentDefinitions => {
  if (docType === "boleta") {
    return buildBoletaDefinition(order, clientInfo);
  }
  const docLabel = "FACTURA ELECTRONICA";
  const emissionDate = formatDateCL(order.createdAt);
  const clientName = clientInfo.name ?? "Cliente no informado";
  const clientRut = formatRut(clientInfo.rut ?? null);
  const docFolio = `FC-${shortId(order.id)}`;

  const itemsBody: TableCell[][] = [];
  itemsBody.push([
    { text: "Item", style: "tableHeader", alignment: "center" },
    { text: "Codigo", style: "tableHeader", alignment: "center" },
    { text: "Detalle", style: "tableHeader", alignment: "left" },
    { text: "Cantidad", style: "tableHeader", alignment: "center" },
    { text: "P. Unitario", style: "tableHeader", alignment: "right" },
    { text: "Descuento", style: "tableHeader", alignment: "right" },
    { text: "Total", style: "tableHeader", alignment: "right" },
  ]);
  order.items.forEach((item, index) => {
    itemsBody.push([
      { text: String(index + 1), style: "cellSmall", alignment: "center" },
      { text: item.productSku ?? item.productId ?? "-", style: "cellText", alignment: "center" },
      { text: item.productName, style: "cellText" },
      { text: String(item.quantity), style: "cellText", alignment: "center" },
      { text: formatCurrencyCLP(item.unitPrice), style: "cellText", alignment: "right" },
      { text: "-", style: "cellText", alignment: "right" },
      { text: formatCurrencyCLP(item.lineTotal), style: "cellTextBold", alignment: "right" },
    ]);
  });

  const itemsLayout: TableLayout = {
    fillColor: (rowIndex: number) => {
      if (rowIndex === 0) return ORDER_PDF_COLORS.primary;
      return rowIndex % 2 === 0 ? "#eef2ff" : null;
    },
    hLineColor: () => ORDER_PDF_COLORS.border,
    vLineColor: () => ORDER_PDF_COLORS.border,
    hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 0 : 0.5),
    vLineWidth: () => 0.5,
  };

  const headerSection: Content = {
    columns: [
      {
        width: "*",
        stack: [
          { text: "INVENT PRO SpA", style: "companyName" },
          { text: "Desarrollo de software y gestion de inventarios", style: "companyMeta" },
          { text: "Av. Apoquindo 1234, Las Condes, Santiago", style: "companyMeta" },
          { text: "contacto@inventpro.cl | +56 2 2345 6789", style: "companyMeta" },
        ],
      },
      {
        width: "auto",
        table: {
          widths: ["auto"],
          body: [
            [{ text: "R.U.T.: 76.543.210-9", style: "invoiceBox", fillColor: "#dc2626", color: "#ffffff" }],
            [{ text: docLabel, style: "invoiceBox", fillColor: "#dc2626", color: "#ffffff" }],
            [{ text: docFolio, style: "invoiceBox", fillColor: "#dc2626", color: "#ffffff" }],
            [{ text: "S.I.I. SANTIAGO CENTRO", style: "invoiceBox", fillColor: "#dc2626", color: "#ffffff" }],
          ],
        },
        layout: "noBorders",
      },
    ],
    margin: [0, 0, 0, 12],
  };

  const receptorSection: Content = {
    table: {
      widths: ["auto", "*"],
      body: [
        [{ text: "Señor(es)", style: "metaLabel" }, { text: clientName, style: "metaValue" }],
        [{ text: "R.U.T.", style: "metaLabel" }, { text: clientRut, style: "metaValue" }],
        [{ text: "Direccion", style: "metaLabel" }, { text: clientInfo.address ?? (order.clientId ? "Cliente registrado" : "No informada"), style: "metaValue" }],
        [{ text: "Comuna", style: "metaLabel" }, { text: "Santiago", style: "metaValue" }],
        [{ text: "Ciudad", style: "metaLabel" }, { text: "Santiago", style: "metaValue" }],
        [{ text: "Fecha emision", style: "metaLabel" }, { text: emissionDate, style: "metaValue" }],
        [{ text: "Referencia", style: "metaLabel" }, { text: `Orden ${order.id}`, style: "metaValue" }],
      ],
    },
    layout: "noBorders",
    margin: [0, 4, 0, 12],
  };

  const totalsTable: Content = {
    table: {
      widths: ["auto", "auto"],
      body: [
        [{ text: "SUBTOTAL", style: "totalLabel" }, { text: formatCurrencyCLP(order.subtotal), style: "grandTotal" }],
        [{ text: "IVA 19%", style: "totalLabel" }, { text: formatCurrencyCLP(order.iva), style: "grandTotal" }],
        [{ text: "TOTAL", style: "totalLabel" }, { text: formatCurrencyCLP(order.totalWithTax), style: "grandTotal" }],
      ],
    },
    layout: "lightHorizontalLines",
    margin: [0, 8, 0, 12],
  };

  const receiptSection: Content = {
    columns: [
      {
        width: "auto",
        table: {
          body: [
            [{ text: "ACUSE DE RECIBO", style: "sectionTitle", alignment: "center" }],
            [{ text: "NOMBRE : ____________________", style: "metaValue" }],
            [{ text: "R.U.T. : ____________________", style: "metaValue" }],
            [{ text: "FECHA : ____________________", style: "metaValue" }],
            [{ text: "FIRMA : ____________________", style: "metaValue" }],
          ],
        },
        layout: "noBorders",
      },
      {
        width: "auto",
        table: {
          widths: ["auto", "auto"],
          body: [
            [{ text: "EXENTO", style: "metaLabel" }, { text: formatCurrencyCLP(0), style: "metaValue", alignment: "right" }],
            [{ text: "TOTAL", style: "metaLabel" }, { text: formatCurrencyCLP(order.totalWithTax), style: "metaValue", alignment: "right" }],
          ],
        },
        layout: "lightHorizontalLines",
      },
      {
        width: "*",
        stack: [
          {
            canvas: [
              { type: "rect", x: 0, y: 0, w: 220, h: 60, color: "#dc2626" },
              { type: "line", x1: 0, y1: 30, x2: 220, y2: 30, lineWidth: 0.5, lineColor: "#ffffff" },
            ],
            margin: [0, 0, 0, 4],
          },
          { text: "Timbre Electronico SII", style: "metaValue", alignment: "center", color: "#dc2626" },
        ],
      },
    ],
    columnGap: 12,
    margin: [0, 12, 0, 0],
  };

  return {
    info: { title: `${docLabel} ${docFolio}`, author: "InventPro" },
    pageMargins: [36, 50, 36, 60],
    defaultStyle: { font: "Roboto", color: ORDER_PDF_COLORS.text },
    content: [
      headerSection,
      receptorSection,
      {
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "*", "auto", "auto", "auto", "auto"],
          body: itemsBody,
        },
        layout: itemsLayout,
      },
      totalsTable,
      receiptSection,
    ],
    styles: {
      companyName: { fontSize: 12, bold: true, color: ORDER_PDF_COLORS.dark },
      companyMeta: { fontSize: 9, color: ORDER_PDF_COLORS.muted },
      invoiceBox: { fontSize: 10, bold: true, color: ORDER_PDF_COLORS.dark, margin: [0, 2, 0, 2], alignment: "center" },
      metaLabel: { fontSize: 9, bold: true, color: ORDER_PDF_COLORS.dark, margin: [0, 2, 6, 2] },
      metaValue: { fontSize: 9, color: ORDER_PDF_COLORS.text, margin: [0, 2, 0, 2] },
      sectionTitle: { fontSize: 10, bold: true, color: ORDER_PDF_COLORS.dark, margin: [0, 0, 0, 6] },
      tableHeader: { fontSize: 9, bold: true, color: "#ffffff", margin: [0, 5, 0, 5] },
      cellText: { fontSize: 9, color: ORDER_PDF_COLORS.text, margin: [0, 4, 0, 4] },
      cellTextBold: { fontSize: 9, bold: true, color: ORDER_PDF_COLORS.text, margin: [0, 4, 0, 4] },
      cellSmall: { fontSize: 8, color: ORDER_PDF_COLORS.text, margin: [0, 4, 0, 4] },
      totalLabel: { fontSize: 10, bold: true, color: ORDER_PDF_COLORS.dark },
      totalValue: { fontSize: 10, color: ORDER_PDF_COLORS.text, alignment: "right" },
      grandTotal: { fontSize: 12, bold: true, color: ORDER_PDF_COLORS.dark, alignment: "right" },
      legalList: { fontSize: 9, color: ORDER_PDF_COLORS.text, margin: [0, 6, 0, 0] },
    },
  };
};

export default function OrdersPage() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [orders, setOrders] = useState<OrderSnapshot[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSnapshot | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderSnapshot["status"] | "all">("all");

  const [clients, setClients] = useState<ClientItem[]>([]);
  const clientsLoadingRef = useRef(false);
  const clientsLoadPromiseRef = useRef<Promise<void> | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [catalogLoadingCount, setCatalogLoadingCount] = useState(0);
  const catalogLoading = catalogLoadingCount > 0;

  const [documentType, setDocumentType] = useState<"boleta" | "factura">("boleta");
  const [customerMode, setCustomerMode] = useState<"client" | "rut">("client");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [rutInput, setRutInput] = useState("");
  const [formLines, setFormLines] = useState<OrderFormLine[]>([createEmptyLine()]);
  const [creating, setCreating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron obtener las ordenes.");
      setListError(message);
      await showError({ title: "Error al listar ordenes", text: message });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadOrderDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const order = await ordersApi.get(id);
      setSelectedOrder(order);
      setStatusDraft(order.status);
      setMode("detail");
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo obtener la orden solicitada.");
      await showError({ title: "Error al cargar la orden", text: message });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const refreshClients = useCallback(async () => {
    if (clientsLoadingRef.current && clientsLoadPromiseRef.current) {
      return clientsLoadPromiseRef.current;
    }
    clientsLoadingRef.current = true;
    const promise = (async () => {
      try {
        const result = await clientsApi.list({ limit: 200 });
        setClients(result.items);
      } catch (err) {
        const message = extractErrorMessage(err, "No se pudieron cargar los clientes.");
        await showError({ title: "Error al cargar clientes", text: message });
      } finally {
        clientsLoadingRef.current = false;
        clientsLoadPromiseRef.current = null;
      }
    })();
    clientsLoadPromiseRef.current = promise;
    return promise;
  }, []);

  const refreshProducts = useCallback(async () => {
    setCatalogLoadingCount((prev) => prev + 1);
    try {
      const result = await productsApi.list({ limit: 200 });
      setProducts(result.items);
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudieron cargar los productos.");
      await showError({ title: "Error al actualizar inventario", text: message });
    } finally {
      setCatalogLoadingCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const ensureCatalogLoaded = useCallback(async () => {
    const needsClients = clients.length === 0;
    const needsProducts = products.length === 0;
    if (!needsClients && !needsProducts) return;

    if (needsClients) {
      await refreshClients();
    }
    if (needsProducts) {
      await refreshProducts();
    }
  }, [clients.length, products.length, refreshClients, refreshProducts]);

  useEffect(() => {
    loadOrders().catch(() => {});
  }, [loadOrders]);

  useEffect(() => {
    refreshClients().catch(() => {});
  }, [refreshClients]);

  useEffect(() => {
    if (mode === "detail" && selectedOrder) {
      setStatusDraft(selectedOrder.status);
    }
  }, [mode, selectedOrder]);

  useEffect(() => {
    if (mode === "create") {
      ensureCatalogLoaded().catch(() => {});
    }
  }, [mode, ensureCatalogLoaded]);

  const sortedOrders = useMemo(() => {
    const clone = [...orders];
    clone.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return clone;
  }, [orders]);

  const enrichedOrders = useMemo(
    () =>
      sortedOrders.map((order, index) => ({
        order,
        code: formatOrderCode(index, sortedOrders.length),
      })),
    [sortedOrders],
  );

  const clientIndex = useMemo(() => {
    const index = new Map<string, ClientItem>();
    clients.forEach((client) => {
      index.set(client.id, client);
    });
    return index;
  }, [clients]);

  const resolveOrderClientInfo = useCallback(
    (order: OrderSnapshot) => {
      const fallbackClient = order.clientId ? clientIndex.get(order.clientId) : undefined;
      return {
        name: order.clientName ?? fallbackClient?.name ?? null,
        rut: order.clientRut ?? fallbackClient?.rut ?? null,
        address: fallbackClient?.address ?? null,
      };
    },
    [clientIndex],
  );

  const filteredOrders = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return enrichedOrders.filter(({ order, code }) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!needle) return true;
      const clientInfo = resolveOrderClientInfo(order);
      const clientName = clientInfo.name ?? "";
      const clientRut = formatRut(clientInfo.rut);
      return (
        stringLowerIncludes(order.id, needle) ||
        stringLowerIncludes(code, needle) ||
        stringLowerIncludes(clientName, needle) ||
        stringLowerIncludes(clientRut, needle)
      );
    });
  }, [enrichedOrders, searchTerm, statusFilter, resolveOrderClientInfo]);

  const statusFilterPills: Array<{ value: OrderSnapshot["status"] | "all"; label: string }> = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendientes" },
    { value: "processing", label: "En proceso" },
    { value: "completed", label: "Completadas" },
    { value: "cancelled", label: "Anuladas" },
  ];

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        acc.subtotal += item.subtotal;
        acc.iva += item.iva;
        acc.totalWithTax += item.totalWithTax;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        subtotal: 0,
        iva: 0,
        totalWithTax: 0,
      },
    );
  }, [orders]);

  const detailedFormLines = useMemo(() => {
    return formLines.map((line) => {
      const product = products.find((item) => String(item.id) === line.productId);
      const unitPrice = product ? Number(product.precio ?? 0) : 0;
      const safeQty = Number.isFinite(line.quantity) && line.quantity > 0 ? line.quantity : 0;
      const lineTotal = unitPrice * safeQty;
      return {
        ...line,
        product,
        unitPrice,
        lineTotal,
      };
    });
  }, [formLines, products]);

  const formTotals = useMemo(() => {
    const subtotal = detailedFormLines.reduce((acc, line) => acc + line.lineTotal, 0);
    return calcVatBreakdown(subtotal);
  }, [detailedFormLines]);

  const resetForm = () => {
    setCustomerMode("client");
    setSelectedClientId("");
    setRutInput("");
    setDocumentType("boleta");
    setFormLines([createEmptyLine()]);
  };

  const handleDelete = async (orderId: string) => {
    const confirmed = await confirmAction({
      title: "Eliminar orden",
      text: "Esta accion restaurara el stock y no se puede deshacer. Deseas continuar?",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await ordersApi.remove(orderId);
      setOrders((prev) => prev.filter((item) => item.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
        setMode("list");
      }
      if (products.length > 0) {
        await refreshProducts();
      }
      await showSuccess({ title: "Orden eliminada", text: "La orden se elimino correctamente." });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo eliminar la orden.");
      await showError({ title: "Error al eliminar", text: message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !statusDraft || statusDraft === selectedOrder.status) return;
    const nextStatus = statusDraft as OrderSnapshot["status"];
    setStatusUpdatingId(selectedOrder.id);
    try {
      const result = await ordersApi.updateStatus(selectedOrder.id, nextStatus);
      setSelectedOrder(result.order);
      setOrders((prev) =>
        prev.map((item) => (item.id === result.order.id ? result.order : item)),
      );
      if (products.length > 0 && (nextStatus === "completed" || nextStatus === "cancelled")) {
        await refreshProducts();
      }
      await showSuccess({ title: "Estado actualizado", text: result.message ?? "Estado modificado." });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo actualizar el estado.");
      await showError({ title: "Cambio de estado no aplicado", text: message });
      setStatusDraft(selectedOrder.status);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const addLine = () => setFormLines((prev) => [...prev, createEmptyLine()]);

  const updateLine = (id: string, changes: Partial<OrderFormLine>) => {
    setFormLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...changes } : line)),
    );
  };

  const removeLine = (id: string) => {
    setFormLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.id !== id)));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const activeLines = detailedFormLines.filter(
      (line) => line.productId && Number.isFinite(line.quantity) && line.quantity > 0,
    );

    if (activeLines.length === 0) {
      await showError({ title: "Productos requeridos", text: "Agrega al menos un producto a la orden." });
      return;
    }

    if (customerMode === "client" && !selectedClientId) {
      await showError({ title: "Cliente requerido", text: "Selecciona un cliente para la orden." });
      return;
    }

    let sanitizedRut = "";
    if (customerMode === "rut") {
      sanitizedRut = sanitizeRutValue(rutInput);
      if (!sanitizedRut.includes("-") || sanitizedRut.length < 9) {
        await showError({
          title: "RUT invalido",
          text: "Ingresa un RUT valido en formato 12345678-9.",
        });
        return;
      }
    }

    if (documentType === "factura") {
      const rutFromClient =
        customerMode === "client"
          ? clients.find((client) => client.id === selectedClientId)?.rut ?? ""
          : sanitizedRut;

      if (!rutFromClient) {
        await showError({
          title: "RUT requerido",
          text: "Para emitir una factura es obligatorio contar con el RUT del contribuyente.",
        });
        return;
      }
    }

    const payload = {
      products: activeLines.map((line) => ({
        productId: line.productId,
        quantity: Math.trunc(line.quantity),
      })),
    } as {
      clientId?: string;
      rut?: string;
      products: Array<{ productId: string; quantity: number }>;
    };

    if (customerMode === "client") {
      payload.clientId = selectedClientId;
    } else {
      payload.rut = sanitizeRutValue(rutInput);
    }

    setCreating(true);
    try {
      const created = await ordersApi.create(payload);
      const detail = await ordersApi.get(created.id);
      setOrders((prev) => [detail, ...prev.filter((item) => item.id !== detail.id)]);
      setSelectedOrder(detail);
      setMode("detail");
      resetForm();
      if (products.length > 0) {
        await refreshProducts();
      }
      await showSuccess({
        title: "Orden creada",
        text: "La orden se registro correctamente. Recuerda generar la boleta o factura segun corresponda.",
      });
    } catch (err) {
      const message = extractErrorMessage(err, "No se pudo crear la orden.");
      await showError({ title: "Error al crear la orden", text: message });
    } finally {
      setCreating(false);
    }
  };

  const renderStatusBadge = (status: OrderSnapshot["status"]) => {
    const config = statusLabels[status];
    const classes = statusToneClasses[config.tone];
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
        {config.label}
      </span>
    );
  };

  const handleDownloadPdf = useCallback(
    async (docType: "boleta" | "factura") => {
      if (!selectedOrder) return;
      const clientInfo = resolveOrderClientInfo(selectedOrder) ?? { name: null, rut: null, address: null };
      try {
        const docDefinition = buildOrderPdfDefinition(selectedOrder, docType, clientInfo);
        const fileName = `${docType}-orden-${shortId(selectedOrder.id)}.pdf`;
        pdfMakeRuntime.createPdf(docDefinition).download(fileName);
      } catch (err) {
        const message = extractErrorMessage(err, "No se pudo generar el PDF tributario.");
        await showError({ title: "Error al generar PDF", text: message });
      }
    },
    [resolveOrderClientInfo, selectedOrder],
  );

  const listView = (
    <>
      <style>{skeletonStyles}</style>
      <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ordenes de compra y venta</h1>
          <p className="text-sm text-gray-500">
            Gestiona las solicitudes y emite documentos tributarios conforme a la normativa chilena.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setMode("create");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          Crear orden
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Total ordenes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">IVA estimado</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrencyCLP(stats.iva)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-xs font-semibold uppercase text-gray-500">Total con impuestos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrencyCLP(stats.totalWithTax)}</p>
        </div>
      </section>

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError}</div>
      )}

      <section className="rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label htmlFor="order-search" className="text-xs font-semibold uppercase text-gray-500">
              Buscar orden
            </label>
            <input
              id="order-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por folio, cliente o RUT"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="md:w-60">
            <label htmlFor="order-status-filter" className="text-xs font-semibold uppercase text-gray-500">
              Estado
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value === "all" ? "all" : (event.target.value as OrderSnapshot["status"]))
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Anulada</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                loadOrders().catch(() => {});
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition duration-150 hover:bg-gray-100 active:scale-[0.98]"
            >
              Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statusFilterPills.map((option) => {
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-blue-300 bg-blue-50 font-semibold text-blue-800 shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Folio
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total c/IVA
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loadingList
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 rounded skeleton-cell" />
                        <div className="mt-2 h-3 w-20 rounded skeleton-cell" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 rounded skeleton-cell" />
                        <div className="mt-2 h-3 w-24 rounded skeleton-cell" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 rounded skeleton-cell" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 rounded skeleton-cell" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 w-24 rounded-full skeleton-cell" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="ml-auto h-4 w-20 rounded skeleton-cell" />
                      </td>
                    </tr>
                  ))
                : filteredOrders.map(({ order, code }) => {
                    const clientInfo = resolveOrderClientInfo(order);
                    return (
                      <tr key={order.id} className="transition-colors duration-150 hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-600">
                          <span>#{code}</span>
                          <span className="ml-2 text-xs text-gray-400">({order.id.slice(0, 8)}...)</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{clientInfo.name ?? "Sin asignar"}</p>
                          <p className="text-xs text-gray-500">RUT: {formatRut(clientInfo.rut)}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDateCL(order.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrencyCLP(order.totalWithTax)}</td>
                        <td className="px-4 py-3">{renderStatusBadge(order.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => loadOrderDetail(order.id).catch(() => {})}
                              className="text-sm font-semibold text-blue-600 transition-colors duration-150 hover:text-blue-700"
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === order.id}
                              onClick={() => handleDelete(order.id)}
                              className="text-sm font-semibold text-red-500 transition-colors duration-150 hover:text-red-600 disabled:opacity-60"
                            >
                              {deletingId === order.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {!loadingList && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No se encontraron ordenes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </>
  );

  const selectedOrderClientInfo = selectedOrder ? resolveOrderClientInfo(selectedOrder) : null;

  const detailView = selectedOrder && (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("list");
              setSelectedOrder(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition duration-150 hover:bg-gray-50 active:scale-[0.98]"
          >
            <span aria-hidden="true">←</span>
            Volver a listado
          </button>
          <span className="text-xs text-gray-400">ID: {selectedOrder.id}</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPdf("boleta")}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition-all duration-150 hover:bg-blue-50 hover:shadow-sm active:scale-95"
            >
              Boleta PDF
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf("factura")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-95"
            >
              Factura PDF
            </button>
          </div>
          {allowedStatusTransitions[selectedOrder.status].length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <select
                value={statusDraft}
                onChange={(event) => setStatusDraft(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={selectedOrder.status}>Estado actual: {statusLabels[selectedOrder.status].label}</option>
                {allowedStatusTransitions[selectedOrder.status].map((option) => (
                  <option key={option} value={option}>
                    Cambiar a: {statusLabels[option].label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={statusUpdatingId === selectedOrder.id || statusDraft === selectedOrder.status}
                onClick={() => handleStatusUpdate()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:shadow-md active:scale-95 disabled:opacity-60"
              >
                {statusUpdatingId === selectedOrder.id ? "Guardando..." : "Guardar estado"}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              resetForm();
              ensureCatalogLoaded().catch(() => {});
              setMode("create");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition duration-150 hover:bg-blue-50 active:scale-[0.98]"
          >
            Generar nueva orden
          </button>
        </div>
      </div>

      {detailLoading ? (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow">Cargando detalle...</div>
      ) : (
        <section className="space-y-6 rounded-xl bg-white p-6 shadow">
          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalle de la orden</h2>
              <p className="text-sm text-gray-500">
                Fecha de emision: {formatDateCL(selectedOrder.createdAt)} · Documento tributario sujeto a IVA del 19%.
              </p>
            </div>
            {renderStatusBadge(selectedOrder.status)}
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Cliente</h3>
              <dl className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Nombre</dt>
                  <dd>{selectedOrderClientInfo?.name ?? "No disponible"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">RUT</dt>
                  <dd>{formatRut(selectedOrderClientInfo?.rut ?? null)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Backorder</dt>
                  <dd>{selectedOrder.isBackorder ? "Si" : "No"}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Totales tributarios</h3>
              <dl className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Subtotal (neto)</dt>
                  <dd>{formatCurrencyCLP(selectedOrder.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">IVA (19%)</dt>
                  <dd>{formatCurrencyCLP(selectedOrder.iva)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold text-gray-800">Total bruto</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrencyCLP(selectedOrder.totalWithTax)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700">Lineas de la orden</h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Producto</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Cantidad</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Precio unitario</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id ?? `${item.productId}-${item.productName}`} className="transition-colors duration-150 hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        {item.productSku && <p className="text-xs text-gray-400">SKU: {item.productSku}</p>}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-gray-600">{formatCurrencyCLP(item.unitPrice)}</td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{formatCurrencyCLP(item.lineTotal)}</td>
                    </tr>
                  ))}
                  {selectedOrder.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                        La orden no tiene lineas asociadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  const createView = (
    <form onSubmit={handleCreate} className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("list");
            resetForm();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition duration-150 hover:bg-gray-100 active:scale-[0.98]"
        >
          <span aria-hidden="true">←</span>
          Volver
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Crear orden</h1>
      </div>

      <section className="rounded-xl bg-white p-6 shadow">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Identificacion tributaria</h2>
          <p className="text-sm text-gray-500">
            Completa la informacion necesaria para emitir boletas o facturas conforme al SII.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="document-type">
              Tipo de documento
            </label>
            <select
              id="document-type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value as "boleta" | "factura")}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="boleta">Boleta electronica</option>
              <option value="factura">Factura electronica</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="customer-mode">
              Identificacion del cliente
            </label>
            <select
              id="customer-mode"
              value={customerMode}
              onChange={(event) => setCustomerMode(event.target.value as "client" | "rut")}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="client">Seleccionar cliente registrado</option>
              <option value="rut">Ingresar RUT manual</option>
            </select>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
            Recuerda validar el RUT y la razon social antes de emitir la boleta o factura en el portal del SII.
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {customerMode === "client" ? (
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="client-id">
                Cliente
              </label>
              <select
                id="client-id"
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                disabled={catalogLoading}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              >
                <option value="">Selecciona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ? RUT {client.rut}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="rut-input">
                RUT del receptor
              </label>
              <input
                id="rut-input"
                type="text"
                value={rutInput}
                placeholder="12345678-9"
                onChange={(event) => setRutInput(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          )}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            {documentType === "factura"
              ? "Las facturas requieren siempre el RUT valido del contribuyente y su giro comercial."
              : "Para boletas electronicas se recomienda registrar el RUT cuando exista."}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Lineas de la orden</h2>
            <p className="text-sm text-gray-500">Selecciona los productos que formaran parte del documento tributario.</p>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 transition duration-150 hover:bg-blue-50 active:scale-[0.98]"
          >
            Agregar producto
          </button>
        </header>

        <div className="space-y-4">
          {detailedFormLines.map((line) => (
            <div key={line.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs font-semibold uppercase text-gray-500">Producto</label>
                <select
                  value={line.productId}
                  onChange={(event) => updateLine(line.id, { productId: event.target.value })}
                  disabled={catalogLoading}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.nombre} ? Stock {product.stock} ? {formatCurrencyCLP(Number(product.precio ?? 0))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:w-32">
                <label className="text-xs font-semibold uppercase text-gray-500">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) => updateLine(line.id, { quantity: Math.max(1, Number(event.target.value)) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="md:w-40">
                <label className="text-xs font-semibold uppercase text-gray-500">Subtotal</label>
                <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrencyCLP(line.lineTotal)}</p>
              </div>
              <div className="flex items-center justify-end md:w-32">
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={formLines.length <= 1}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition duration-150 hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
                >
                  {formLines.length <= 1 ? "Minimo" : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Totales</p>
            <p className="text-sm text-gray-600">
              Calculados con IVA vigente del 19% conforme a la normativa tributaria chilena.
            </p>
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              Subtotal (neto): <span className="font-semibold text-gray-900">{formatCurrencyCLP(formTotals.subtotal)}</span>
            </p>
            <p>
              IVA (19%): <span className="font-semibold text-gray-900">{formatCurrencyCLP(formTotals.iva)}</span>
            </p>
            <p>
              Total con impuestos:{" "}
              <span className="font-semibold text-gray-900">{formatCurrencyCLP(formTotals.totalWithTax)}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setMode("list");
          }}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition duration-150 hover:bg-gray-100 active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={creating || catalogLoading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition-all duration-150 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          {creating ? "Guardando..." : "Guardar orden"}
        </button>
      </section>
    </form>
  );

  const motionProps = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: easeOut },
  };

  if (mode === "create") {
    return <motion.div {...motionProps}>{createView}</motion.div>;
  }
  if (mode === "detail" && selectedOrder) {
    return <motion.div {...motionProps}>{detailView}</motion.div>;
  }
  return <motion.div {...motionProps}>{listView}</motion.div>;
}


