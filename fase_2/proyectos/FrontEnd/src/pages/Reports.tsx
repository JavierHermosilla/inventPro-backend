import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfMakeFonts from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { confirmAction, showError, showInfo, showSuccess } from "../lib/alerts";
import {
  reportsApi,
  type CreateReportPayload,
  type ReportFilters,
  type ReportFormat,
  type ReportItem,
  type ReportStatus,
} from "../lib/reportsApi";
import { ordersApi, type OrderSnapshot } from "../lib/ordersApi";
import { productsApi, type ProductItem } from "../lib/productsApi";
import manualInventoryApi, { type ManualInventoryItem } from "../lib/manualInventoryApi";
import { usersApi, type UserItem } from "../lib/usersApi";
import { clientsApi } from "../lib/clientsApi";
import { suppliersApi } from "../lib/suppliersApi";

type PdfMakeInstance = typeof pdfMake & {
  default?: typeof pdfMake;
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  vfs?: Record<string, string>;
  fonts?: Record<string, unknown>;
};

// pdfmake's module namespace is frozen in some bundlers; use the actual instance under .default.
const pdfMakeInstance = pdfMake as unknown as PdfMakeInstance;
const pdfMakeRuntime = (pdfMakeInstance.default ?? pdfMakeInstance) as PdfMakeInstance;

// Asegura que las fuentes Roboto estén disponibles en tiempo de ejecución (build y dev).
const pdfVfs =
  (pdfMakeFonts as unknown as { pdfMake?: { vfs?: Record<string, string> } }).pdfMake?.vfs ??
  (pdfMakeFonts as unknown as { vfs?: Record<string, string> }).vfs ??
  (pdfMakeRuntime as unknown as { vfs?: Record<string, string> }).vfs;

// Registra el VFS incluso si ya existía parcialmente
if (typeof pdfMakeRuntime.addVirtualFileSystem === "function" && pdfVfs) {
  pdfMakeRuntime.addVirtualFileSystem(pdfVfs);
} else if (pdfVfs) {
  pdfMakeRuntime.vfs = pdfVfs;
}

// Mapea fuentes por defecto para evitar "Roboto-Medium.ttf not found"
pdfMakeRuntime.fonts = pdfMakeRuntime.fonts ?? {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const DEFAULT_LEGAL_NOTES = [
  "Respalda la informacion conforme a la Resolucion Exenta SII 45/2003 y sus actualizaciones.",
  "Conserva copias digitales y respaldos por al menos 6 anos (Art. 17 Codigo Tributario).",
  "Verifica la consistencia con libros electronicos y sistemas contables oficiales antes de remitirlo a terceros.",
];

const TYPE_SPECIFIC_LEGAL_NOTES: Partial<Record<ReportTypeId, string[]>> = {
  sales: [
    "La informacion facilita la conciliacion con el Formulario 29 y cruces de DTE aceptados por el SII.",
    "Incluye solo documentos tributarios vigentes y con folio autorizado.",
  ],
  stock: [
    "Valorizacion conforme a NIC 2 y criterios del Colegio de Contadores de Chile.",
    "Manten respaldos de inventarios fisicos y ajustes autorizados.",
  ],
  movements: [
    "Movimientos controlados segun Resolucion Exenta SII 59/2020 para trazabilidad de inventarios.",
    "Respalda cada ajuste con actas firmadas, guias o evidencia fotografica.",
  ],
};

const PDF_PAGE_FOOTER = (currentPage: number, pageCount: number) => ({
  text: `Página ${currentPage} de ${pageCount} · Documento generado por InventPro · Uso interno y fiscalizable`,
  style: "footer",
});

type ReportTypeId = "sales" | "clients" | "suppliers" | "stock" | "movements";

type Option = { value: string; label: string };

type ReportDefinition = {
  value: ReportTypeId;
  label: string;
  description: string;
  requiresDateRange: boolean;
  supportsProductFilter: boolean;
  supportsUserFilter: boolean;
};

const REPORT_DEFINITIONS: ReportDefinition[] = [
  { value: "sales", label: "Ordenes de ventas", description: "Ordenes generadas y ventas con impuestos.", requiresDateRange: true, supportsProductFilter: true, supportsUserFilter: false },
  { value: "clients", label: "Clientes", description: "Listado general de clientes.", requiresDateRange: true, supportsProductFilter: false, supportsUserFilter: false },
  { value: "suppliers", label: "Proveedores", description: "Proveedores y condiciones comerciales.", requiresDateRange: true, supportsProductFilter: false, supportsUserFilter: false },
  { value: "stock", label: "Productos con stock", description: "Productos con stock disponible y valorizacion.", requiresDateRange: false, supportsProductFilter: true, supportsUserFilter: false },
  { value: "movements", label: "Inventario manual con responsable", description: "Movimientos manuales con responsable.", requiresDateRange: true, supportsProductFilter: true, supportsUserFilter: true },
];

const REPORT_FORMAT_OPTIONS: Array<{ value: ReportFormat; label: string }> = [
  { value: "pdf", label: "PDF" },
  { value: "xls", label: "XLS (Excel)" },
  { value: "dashboard", label: "Dashboard" },
];

const REPORT_STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> = [
  { value: "active", label: "Activo" },
  { value: "draft", label: "Borrador" },
  { value: "archived", label: "Archivado" },
];

const DELIVERY_OPTIONS: Option[] = [
  { value: "immediate-download", label: "Descarga inmediata" },
  { value: "email", label: "Enviar por email" },
  { value: "shared-link", label: "Compartir link" },
];

type ReportFormState = {
  name: string;
  description: string;
  type: ReportTypeId;
  format: ReportFormat;
  status: ReportStatus;
  deliveryMethod: string;
  startDate: string;
  endDate: string;
  productIds: string[];
  userIds: string[];
};

const INITIAL_FORM_STATE: ReportFormState = {
  name: "",
  description: "",
  type: "sales",
  format: "pdf",
  status: "active",
  deliveryMethod: "immediate-download",
  startDate: "",
  endDate: "",
  productIds: [],
  userIds: [],
};

const buildVirtualReports = (): ReportItem[] => {
  const now = new Date();
  const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const filters: ReportFilters = {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
    productIds: null,
    userIds: null,
  };

  return [
    {
      id: "clients-report-pdf",
      name: "Reporte de clientes (PDF)",
      description: "Datos de contacto y RUT de clientes registrados.",
      type: "clients",
      filters,
      format: "pdf",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "clients-report-xls",
      name: "Reporte de clientes (Excel)",
      description: "Datos de contacto y RUT de clientes registrados.",
      type: "clients",
      filters,
      format: "xls",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "suppliers-report-pdf",
      name: "Reporte de proveedores (PDF)",
      description: "Proveedores, contactos y estado comercial.",
      type: "suppliers",
      filters,
      format: "pdf",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "suppliers-report-xls",
      name: "Reporte de proveedores (Excel)",
      description: "Proveedores, contactos y estado comercial.",
      type: "suppliers",
      filters,
      format: "xls",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "sales-report-pdf",
      name: "Reporte de ordenes de ventas (PDF)",
      description: "Ordenes y ventas generadas en el periodo.",
      type: "sales",
      filters,
      format: "pdf",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "sales-report-xls",
      name: "Reporte de ordenes de ventas (Excel)",
      description: "Ordenes y ventas generadas en el periodo.",
      type: "sales",
      filters,
      format: "xls",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "suppliers-report-pdf",
      name: "Reporte de proveedores (PDF)",
      description: "Proveedores, contactos y estado comercial.",
      type: "suppliers",
      filters,
      format: "pdf",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "suppliers-report-xls",
      name: "Reporte de proveedores (Excel)",
      description: "Proveedores, contactos y estado comercial.",
      type: "suppliers",
      filters,
      format: "xls",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "stock-report-pdf",
      name: "Reporte de productos con stock (PDF)",
      description: "Inventario valorizado y unidades disponibles.",
      type: "stock",
      filters,
      format: "pdf",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "stock-report-xls",
      name: "Reporte de productos con stock (Excel)",
      description: "Inventario valorizado y unidades disponibles.",
      type: "stock",
      filters,
      format: "xls",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "movements-report-pdf",
      name: "Reporte de inventario manual con responsable (PDF)",
      description: "Movimientos manuales con responsable.",
      type: "movements",
      filters,
      format: "pdf",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
    {
      id: "movements-report-xls",
      name: "Reporte de inventario manual con responsable (Excel)",
      description: "Movimientos manuales con responsable.",
      type: "movements",
      filters,
      format: "xls",
      status: "active",
      deliveryMethod: "immediate-download",
      createdAt: null,
      updatedAt: null,
      createdById: null,
      createdByName: "Sistema",
      createdByEmail: null,
      lastRunAt: null,
      executionTimeMs: null,
      virtual: true,
    },
  ];
};

type ReportDataset = {
  summary: Array<{ label: string; value: string }>;
  table: { headers: string[]; rows: Array<Array<string>> };
  periodLabel: string;
  filterDetails: string[];
  legalNotes: string[];
  generatedAtIso: string;
};

const numberCL = new Intl.NumberFormat("es-CL");
const currencyCL = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Sin ejecutar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const normalizeDateInput = (value: string) => value.slice(0, 10);

const toISODate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const coerceDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const inRange = (target: Date | null, start: Date | null, end: Date | null) => {
  if (!target) return false;
  if (start && target < start) return false;
  if (end && target > end) return false;
  return true;
};

const buildDatasetResult = (
  report: ReportItem,
  data: { summary: Array<{ label: string; value: string }>; table: { headers: string[]; rows: Array<Array<string>> }; legalNotes?: string[] }
): ReportDataset => {
  const startLabel = report.filters.startDate ? formatDate(report.filters.startDate) : "No informado";
  const endLabel = report.filters.endDate ? formatDate(report.filters.endDate) : "No informado";
  const periodLabel = `${startLabel} - ${endLabel}`;

  const filterDetails: string[] = [];
  if (report.filters.productIds && report.filters.productIds.length > 0) {
    filterDetails.push(`Productos filtrados: ${report.filters.productIds.join(", ")}`);
  }
  if (report.filters.userIds && report.filters.userIds.length > 0) {
    filterDetails.push(`Usuarios responsables: ${report.filters.userIds.join(", ")}`);
  }

  const specificNotes = TYPE_SPECIFIC_LEGAL_NOTES[report.type as ReportTypeId] ?? [];
  const legalNotes = [...DEFAULT_LEGAL_NOTES, ...specificNotes, ...(data.legalNotes ?? [])];

  return {
    summary: data.summary,
    table: data.table,
    periodLabel,
    filterDetails,
    legalNotes,
    generatedAtIso: new Date().toISOString(),
  };
};

const buildPdfDefinition = (report: ReportItem, dataset: ReportDataset): TDocumentDefinitions => {
  const generatedLabel = new Date(dataset.generatedAtIso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const filtersRows = [
    [{ text: "Periodo informado", style: "metaLabel" }, { text: dataset.periodLabel, style: "metaValue" }],
    ...(dataset.filterDetails.length > 0
      ? dataset.filterDetails.map((detail, index) => [
          { text: index === 0 ? "Filtros aplicados" : "", style: "metaLabel" },
          { text: detail, style: "metaValue" },
        ])
      : [[{ text: "Filtros aplicados", style: "metaLabel" }, { text: "Sin filtros adicionales", style: "metaValue" }]]),
  ];

  const filtersSection: Content = {
    table: {
      widths: ["auto", "*"],
      body: filtersRows,
    },
    layout: "noBorders",
    margin: [0, 0, 0, 16],
  };

  const summarySection: Content | null =
    dataset.summary.length > 0
      ? {
          table: {
            headerRows: 0,
            widths: dataset.summary.map(() => "*"),
            body: [
              dataset.summary.map((item) => ({
                stack: [
                  { text: item.label, style: "summaryLabel" },
                  { text: item.value, style: "summaryValue" },
                ],
              })),
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 16],
        }
      : null;

  const detailSection: Content = {
    table: {
      headerRows: 1,
      widths: dataset.table.headers.map(() => "*"),
      body: [
        dataset.table.headers.map((header) => ({ text: header, style: "tableHeader" })),
        ...dataset.table.rows.map((row) => row.map((cell) => ({ text: cell, style: "tableCell" }))),
      ],
    },
    layout: {
      fillColor: (rowIndex: number) => {
        if (rowIndex === 0) return "#1d4ed8";
        return rowIndex % 2 === 0 ? "#f1f5f9" : null;
      },
      hLineColor: () => "#cbd5f5",
      vLineColor: () => "#cbd5f5",
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
    },
  };

  const legalSection: Content = {
    stack: [
      { text: "Notas legales y cumplimiento", style: "legalTitle" },
      {
        ul: dataset.legalNotes.map((note) => ({ text: note, style: "legalItem" })),
      },
    ],
    margin: [0, 20, 0, 0],
  };

  const content: Content[] = [
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "Invent Pro SpA", style: "companyName" },
            { text: "RUT 76.543.210-9", style: "companyMeta" },
            { text: "Av. Apoquindo 1234, Las Condes, Santiago", style: "companyMeta" },
            { text: "contacto@inventpro.cl | +56 2 2345 6789", style: "companyMeta" },
          ],
        },
        {
          width: "auto",
          stack: [
            { text: report.name, style: "documentTitle" },
            { text: `Tipo: ${report.type}`, style: "documentMeta" },
            { text: `Generado el ${generatedLabel}`, style: "documentMeta" },
          ],
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 18],
    },
    filtersSection,
    summarySection,
    detailSection,
    legalSection,
  ].filter(Boolean) as Content[];

  return {
    info: { title: report.name, author: report.createdByName ?? "InventPro" },
    content,
    pageMargins: [40, 60, 40, 70],
    footer: PDF_PAGE_FOOTER,
    styles: {
      companyName: { fontSize: 11, bold: true, color: "#1f2937" },
      companyMeta: { fontSize: 9, color: "#475569" },
      documentTitle: { fontSize: 12, bold: true, color: "#0f172a" },
      documentMeta: { fontSize: 9, color: "#475569" },
      metaLabel: { fontSize: 9, bold: true, color: "#1f2937", margin: [0, 2, 12, 2] },
      metaValue: { fontSize: 9, color: "#0f172a", margin: [0, 2, 0, 2] },
      summaryLabel: { fontSize: 9, color: "#475569", margin: [0, 0, 0, 2] },
      summaryValue: { fontSize: 16, bold: true, color: "#0f172a" },
      tableHeader: { fontSize: 10, bold: true, color: "#ffffff" },
      tableCell: { fontSize: 9, color: "#0f172a", margin: [0, 4, 0, 4] },
      legalTitle: { fontSize: 10, bold: true, color: "#0f172a", margin: [0, 0, 0, 6] },
      legalItem: { fontSize: 9, color: "#0f172a", margin: [0, 2, 0, 2] },
      footer: { fontSize: 8, color: "#475569", alignment: "center" },
    },
    // Usamos Roboto, la fuente incluida de forma nativa en pdfMake, para evitar dependencias externas.
    defaultStyle: { font: "Roboto" },
  };
};

const extractFormFilters = (filters: ReportFilters) => {
  const startDate = filters.startDate ? normalizeDateInput(filters.startDate) : "";
  const endDate = filters.endDate ? normalizeDateInput(filters.endDate) : "";
  const productIds = Array.isArray(filters.productIds) ? filters.productIds.map(String) : [];
  const userIds = Array.isArray(filters.userIds) ? filters.userIds.map(String) : [];
  return { startDate, endDate, productIds, userIds };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ReportTypeId | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ReportFormState>(INITIAL_FORM_STATE);
  const [saving, setSaving] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const ensureVirtualReports = useCallback((items: ReportItem[]): ReportItem[] => {
    const virtuals = buildVirtualReports();
    const cleanItems = items.filter((item) => !virtuals.some((virtual) => virtual.id === item.id));
    return [...virtuals, ...cleanItems];
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.list();
      setReports(ensureVirtualReports(response.items));
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible cargar los reportes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ensureVirtualReports]);

  useEffect(() => {
    loadReports().catch(() => {});
  }, [loadReports]);

  useEffect(() => {
    let cancelled = false;
    const fetchCatalogs = async () => {
      setCatalogLoading(true);
      try {
        const [productsResult, usersResult] = await Promise.all([
          productsApi.list({ limit: 200 }),
          usersApi.list({ page: 1, limit: 200 }),
        ]);
        if (cancelled) return;
        setProductOptions(
          productsResult.items.map((product: ProductItem) => ({
            value: String(product.id),
            label: `${product.nombre} (stock ${product.stock})`,
          })),
        );
        setUserOptions(
          usersResult.items.map((user: UserItem) => ({
            value: user.id,
            label: `${user.name} (${user.email})`,
          })),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "No fue posible cargar catalogos.";
        showError({ title: "Error cargando catalogos", text: message }).catch(() => {});
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };
    fetchCatalogs().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (typeFilter !== "all" && report.type !== typeFilter) return false;
      if (!query) return true;
      const text = `${report.name} ${report.description ?? ""} ${report.type} ${report.status} ${report.createdByName ?? ""} ${report.createdByEmail ?? ""}`.toLowerCase();
      return text.includes(query);
    });
  }, [reports, searchTerm, statusFilter, typeFilter]);

  const currentDefinition =
    REPORT_DEFINITIONS.find((item) => item.value === formState.type) ?? REPORT_DEFINITIONS[0];

  const handleInputChange =
    (field: keyof ReportFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value as never }));
    };

  const handleDateChange = (field: "startDate" | "endDate") => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: normalizeDateInput(event.target.value) }));
  };

  const handleMultiSelectChange = (field: "productIds" | "userIds") => (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setFormState((prev) => ({ ...prev, [field]: selected }));
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingId(null);
    setShowForm(false);
  };

  const handleOpenForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingId(null);
    setShowForm(true);
  };

  const buildFiltersPayload = (): ReportFilters => {
    const filters: ReportFilters = {};
    if (formState.startDate) filters.startDate = toISODate(formState.startDate);
    if (formState.endDate) filters.endDate = toISODate(formState.endDate);
    if (formState.productIds.length > 0) filters.productIds = formState.productIds;
    if (formState.userIds.length > 0) filters.userIds = formState.userIds;
    return filters;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      await showError({ title: "Nombre requerido", text: "Ingresa un nombre para el reporte." });
      return;
    }
    if (currentDefinition.requiresDateRange) {
      if (!formState.startDate || !formState.endDate) {
        await showError({ title: "Rango requerido", text: "Selecciona fecha inicio y termino usando el calendario." });
        return;
      }
      if (new Date(formState.startDate) > new Date(formState.endDate)) {
        await showError({ title: "Rango invalido", text: "La fecha inicial no puede ser mayor que la final." });
        return;
      }
    }

    const payload: CreateReportPayload = {
      name: trimmedName,
      description: formState.description.trim() || undefined,
      type: formState.type,
      format: formState.format,
      status: formState.status,
      deliveryMethod: formState.deliveryMethod,
      filters: buildFiltersPayload(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await reportsApi.update(editingId, payload);
        await showSuccess({ title: "Reporte actualizado", text: "Los cambios se guardaron." });
      } else {
        await reportsApi.create(payload);
        await showSuccess({ title: "Reporte creado", text: "El reporte se registro en el backend." });
      }
      await loadReports();
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el reporte.";
      await showError({ title: "Error al guardar", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (report: ReportItem) => {
    if (report.virtual) {
      showInfo({ title: "Reporte fijo", text: "Los reportes predefinidos no se pueden editar." }).catch(() => {});
      return;
    }
    const filters = extractFormFilters(report.filters);
    setFormState({
      name: report.name,
      description: report.description ?? "",
      type: (REPORT_DEFINITIONS.find((item) => item.value === report.type)?.value ?? "sales") as ReportTypeId,
      format: report.format,
      status: report.status,
      deliveryMethod: report.deliveryMethod ?? "immediate-download",
      startDate: filters.startDate,
      endDate: filters.endDate,
      productIds: filters.productIds,
      userIds: filters.userIds,
    });
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleDelete = async (report: ReportItem) => {
    if (report.virtual) {
      showInfo({ title: "Reporte fijo", text: "Los reportes predefinidos no se pueden eliminar." }).catch(() => {});
      return;
    }
    const confirmed = await confirmAction({
      title: `Eliminar "${report.name}"`,
      text: "La operacion no se puede deshacer.",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;
    setDeletingId(report.id);
    try {
      await reportsApi.remove(report.id);
      await showSuccess({ title: "Reporte eliminado", text: "El registro fue eliminado." });
      await loadReports();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar el reporte.";
      await showError({ title: "Error al eliminar", text: message });
    } finally {
      setDeletingId(null);
    }
  };
  const buildSalesDataset = useCallback(async (report: ReportItem): Promise<ReportDataset | null> => {
    const start = coerceDate(report.filters.startDate ?? null);
    const end = coerceDate(report.filters.endDate ?? null);
    const productIds = new Set((report.filters.productIds ?? []).map(String));
    const orders = await ordersApi.list();
    const filtered = orders.filter((order: OrderSnapshot) => {
      const created = coerceDate(order.createdAt);
      if (!inRange(created, start, end)) return false;
      if (productIds.size === 0) return true;
      return order.items.some((item) => productIds.has(String(item.productId)));
    });
    if (filtered.length === 0) return null;
    const totalNet = filtered.reduce((acc, order) => acc + order.subtotal, 0);
    const totalVat = filtered.reduce((acc, order) => acc + order.iva, 0);
    const totalGross = filtered.reduce((acc, order) => acc + order.totalWithTax, 0);
    return buildDatasetResult(report, {
      summary: [
        { label: "Ordenes incluidas", value: numberCL.format(filtered.length) },
        { label: "Ventas netas", value: currencyCL.format(totalNet) },
        { label: "IVA", value: currencyCL.format(totalVat) },
        { label: "Total con impuestos", value: currencyCL.format(totalGross) },
      ],
      table: {
        headers: ["Orden", "Fecha", "Cliente", "Subtotal", "IVA", "Total"],
        rows: filtered.map((order) => [
          order.id,
          formatDate(order.createdAt),
          order.clientName ?? "Sin cliente",
          currencyCL.format(order.subtotal),
          currencyCL.format(order.iva),
          currencyCL.format(order.totalWithTax),
        ]),
      },
    });
  }, []);

  const buildStockDataset = useCallback(async (report: ReportItem): Promise<ReportDataset | null> => {
    const productIds = new Set((report.filters.productIds ?? []).map(String));
    const products = await productsApi.list({ limit: 200 });
    const filtered = products.items.filter((product) => productIds.size === 0 || productIds.has(String(product.id)));
    if (filtered.length === 0) return null;
    const totalStock = filtered.reduce((acc, product) => acc + product.stock, 0);
    const totalValue = filtered.reduce((acc, product) => acc + product.stock * product.precio, 0);
    return buildDatasetResult(report, {
      summary: [
        { label: "Productos evaluados", value: numberCL.format(filtered.length) },
        { label: "Unidades totales", value: numberCL.format(totalStock) },
        { label: "Valor inventario", value: currencyCL.format(totalValue) },
      ],
      table: {
        headers: ["ID", "Producto", "Categoria", "Stock", "Precio", "Total"],
        rows: filtered.map((product) => [
          String(product.id),
          product.nombre,
          product.categoryName ?? "Sin categoría",
          numberCL.format(product.stock),
          currencyCL.format(product.precio),
          currencyCL.format(product.stock * product.precio),
        ]),
      },
    });
  }, []);

  const buildMovementsDataset = useCallback(async (report: ReportItem): Promise<ReportDataset | null> => {
    const start = coerceDate(report.filters.startDate ?? null);
    const end = coerceDate(report.filters.endDate ?? null);
    const productIds = new Set((report.filters.productIds ?? []).map(String));
    const userIds = new Set((report.filters.userIds ?? []).map(String));
    const response = await manualInventoryApi.list({ limit: 200 });
    const filtered = response.records.filter((movement: ManualInventoryItem) => {
      const created = coerceDate(movement.createdAt);
      if (!inRange(created, start, end)) return false;
      if (productIds.size > 0 && !productIds.has(String(movement.productId))) return false;
      if (userIds.size > 0 && movement.userId && !userIds.has(String(movement.userId))) return false;
      return true;
    });
    if (filtered.length === 0) return null;
    const totalIncrease = filtered.filter((item) => item.type === "increase").reduce((acc, item) => acc + item.quantity, 0);
    const totalDecrease = filtered.filter((item) => item.type === "decrease").reduce((acc, item) => acc + item.quantity, 0);
    return buildDatasetResult(report, {
      summary: [
        { label: "Movimientos evaluados", value: numberCL.format(filtered.length) },
        { label: "Entradas", value: numberCL.format(totalIncrease) },
        { label: "Salidas", value: numberCL.format(totalDecrease) },
      ],
      table: {
        headers: ["Fecha", "Producto", "Tipo", "Cantidad", "Responsable", "Motivo"],
        rows: filtered.map((movement) => [
          formatDate(movement.createdAt),
          movement.productName,
          movement.type === "increase" ? "Ingreso" : "Salida",
          numberCL.format(movement.quantity),
          movement.performedBy ?? "No disponible",
          movement.reason ?? "Sin motivo",
        ]),
      },
    });
  }, []);

  const buildClientsDataset = useCallback(async (report: ReportItem): Promise<ReportDataset | null> => {
    const clientsResult = await clientsApi.list({ limit: 200 });
    if (clientsResult.items.length === 0) return null;

    const summary = [
      { label: "Clientes totales", value: numberCL.format(clientsResult.items.length) },
      { label: "Email registrados", value: numberCL.format(clientsResult.items.filter((c) => Boolean(c.email)).length) },
    ];

    const table = {
      headers: ["Nombre", "RUT", "Correo", "Telefono", "Direccion"],
      rows: clientsResult.items.map((client) => [
        client.name,
        client.rut,
        client.email ?? "Sin correo",
        client.phone ?? "Sin telefono",
        client.address ?? "Sin direccion",
      ]),
    };

    return buildDatasetResult(report, { summary, table });
  }, []);

  const buildSuppliersDataset = useCallback(async (report: ReportItem): Promise<ReportDataset | null> => {
    const suppliersResult = await suppliersApi.list();
    if (suppliersResult.items.length === 0) return null;

    const active = suppliersResult.items.filter((s) => s.status === "active").length;
    const inactive = suppliersResult.items.length - active;

    const summary = [
      { label: "Proveedores totales", value: numberCL.format(suppliersResult.items.length) },
      { label: "Activos", value: numberCL.format(active) },
      { label: "Inactivos", value: numberCL.format(inactive) },
    ];

    const table = {
      headers: ["Proveedor", "RUT", "Contacto", "Correo", "Telefono", "Estado"],
      rows: suppliersResult.items.map((supplier) => [
        supplier.name,
        supplier.rut,
        supplier.contactName ?? "No informado",
        supplier.email ?? "Sin correo",
        supplier.phone ?? "Sin telefono",
        supplier.status === "active" ? "Activo" : "Inactivo",
      ]),
    };

    return buildDatasetResult(report, { summary, table });
  }, []);

  const buildDataset = useCallback(
    async (report: ReportItem): Promise<ReportDataset | null> => {
      switch (report.type as ReportTypeId) {
        case "sales":
          return buildSalesDataset(report);
        case "stock":
          return buildStockDataset(report);
        case "movements":
          return buildMovementsDataset(report);
        case "clients":
          return buildClientsDataset(report);
        case "suppliers":
          return buildSuppliersDataset(report);
        default:
          return null;
      }
    },
    [buildSalesDataset, buildStockDataset, buildMovementsDataset, buildClientsDataset, buildSuppliersDataset],
  );

  const triggerFileDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPdfFile = (report: ReportItem, dataset: ReportDataset) =>
    new Promise<void>((resolve, reject) => {
      try {
        const pdfDocument = pdfMake.createPdf(buildPdfDefinition(report, dataset));
        pdfDocument.getBlob((blob) => {
          try {
            const filename = `reporte-${report.id}-${dataset.generatedAtIso.slice(0, 10)}.pdf`;
            triggerFileDownload(blob, filename);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error as Error);
      }
    });

  const escapeForExcel = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const downloadExcelFile = (report: ReportItem, dataset: ReportDataset) => {
    const summaryRows = [
      `<tr><th align="left">Periodo informado</th><td>${escapeForExcel(dataset.periodLabel)}</td></tr>`,
      ...dataset.summary.map((item) => `<tr><th align="left">${escapeForExcel(item.label)}</th><td>${escapeForExcel(item.value)}</td></tr>`),
    ];

    const filtersRows =
      dataset.filterDetails.length > 0
        ? dataset.filterDetails.map(
            (detail, index) =>
              `<tr><th align="left">${index === 0 ? "Filtros aplicados" : ""}</th><td>${escapeForExcel(detail)}</td></tr>`
          )
        : [`<tr><th align="left">Filtros aplicados</th><td>Sin filtros adicionales</td></tr>`];

    const detailHeader = `<tr>${dataset.table.headers
      .map((header) => `<th>${escapeForExcel(header)}</th>`)
      .join("")}</tr>`;

    const detailRows =
      dataset.table.rows.length > 0
        ? dataset.table.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeForExcel(cell)}</td>`).join("")}</tr>`)
            .join("")
        : `<tr><td colspan="${dataset.table.headers.length}">Sin registros coincidentes</td></tr>`;

    const legalList =
      dataset.legalNotes.length > 0
        ? dataset.legalNotes.map((note) => `<li>${escapeForExcel(note)}</li>`).join("")
        : "<li>Sin notas registradas</li>";

    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; width: 100%; }
      th, td { border: 1px solid #b4c6e7; padding: 6px; }
      th { background-color: #1d4ed8; color: #ffffff; text-align: left; }
      caption { font-weight: bold; margin-bottom: 6px; text-align: left; }
      ul { font-family: Arial, sans-serif; font-size: 11px; padding-left: 18px; }
    </style>
  </head>
  <body>
    <table>
      <caption>Resumen ejecutivo</caption>
      ${summaryRows.join("")}
      ${filtersRows.join("")}
    </table>
    <br />
    <table>
      <caption>Detalle del reporte</caption>
      ${detailHeader}
      ${detailRows}
    </table>
    <br />
    <h4>Notas legales y cumplimiento</h4>
    <ul>${legalList}</ul>
  </body>
</html>`;

    const blob = new Blob(["\uFEFF" + htmlContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const filename = `reporte-${report.id}-${dataset.generatedAtIso.slice(0, 10)}.xls`;
    triggerFileDownload(blob, filename);
  };

  const handleExecute = async (report: ReportItem) => {
    setExecutingId(report.id);
    try {
      const dataset = await buildDataset(report);
      if (!dataset) {
        await showInfo({ title: "Sin datos", text: "No encontramos datos en el backend para este filtro." });
        return;
      }

      if (report.format === "pdf") {
        await downloadPdfFile(report, dataset);
        const stamp = dataset.generatedAtIso;
        setReports((prev) => prev.map((item) => (item.id === report.id ? { ...item, lastRunAt: stamp, updatedAt: stamp } : item)));
        await showSuccess({ title: "Reporte generado", text: "El PDF se descargo correctamente." });
        return;
      }

      if (report.format === "xls") {
        downloadExcelFile(report, dataset);
        const stamp = dataset.generatedAtIso;
        setReports((prev) => prev.map((item) => (item.id === report.id ? { ...item, lastRunAt: stamp, updatedAt: stamp } : item)));
        await showSuccess({ title: "Reporte generado", text: "El archivo Excel se descargo correctamente." });
        return;
      }

      await showInfo({
        title: "Formato no disponible",
        text: "Por ahora solo es posible descargar reportes en PDF o Excel desde la interfaz web.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo generar el reporte.";
      await showError({ title: "Error al generar", text: message });
    } finally {
      setExecutingId(null);
    }
  };
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestion de reportes</h1>
          <p className="text-sm text-slate-500">
            Usa el calendario y los filtros exactos que consume el backend para asegurar reportes consistentes.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre o creador"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
          />
          <button
            type="button"
            onClick={handleOpenForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Nuevo reporte
          </button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-500">
          Estado
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ReportStatus | "all")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Todos</option>
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-500">
          Tipo de reporte
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as ReportTypeId | "all")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Todos</option>
            {REPORT_DEFINITIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end text-sm text-slate-500">
          {catalogLoading ? "Cargando catalogos..." : `${productOptions.length} productos y ${userOptions.length} usuarios disponibles.`}
        </div>
      </section>

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{editingId ? "Editar reporte" : "Crear nuevo reporte"}</h2>
              <p className="text-sm text-slate-500">
                Selecciona el rango de fechas desde el calendario y los filtros del backend antes de guardar.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </header>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Nombre del reporte
                <input
                  type="text"
                  value={formState.name}
                  onChange={handleInputChange("name")}
                  placeholder="Ej: Ventas trimestrales"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Tipo de reporte
                <select
                  value={formState.type}
                  onChange={(event) => {
                    const value = event.target.value as ReportTypeId;
                    const definition = REPORT_DEFINITIONS.find((item) => item.value === value);
                    setFormState((prev) => ({
                      ...prev,
                      type: value,
                      productIds: definition?.supportsProductFilter ? prev.productIds : [],
                      userIds: definition?.supportsUserFilter ? prev.userIds : [],
                    }));
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {REPORT_DEFINITIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">{currentDefinition.description}</span>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Descripcion breve
              <textarea
                value={formState.description}
                onChange={handleInputChange("description")}
                rows={3}
                placeholder="Describe el objetivo del reporte"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3 rounded-lg border border-slate-200 p-4">
                <span className="text-sm font-semibold text-slate-600">Rango de fechas</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Desde
                    <input
                      type="date"
                      value={formState.startDate}
                      onChange={handleDateChange("startDate")}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      required={currentDefinition.requiresDateRange}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Hasta
                    <input
                      type="date"
                      value={formState.endDate}
                      onChange={handleDateChange("endDate")}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      required={currentDefinition.requiresDateRange}
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">Los valores se envian como startDate y endDate en formato ISO al backend.</p>
              </div>

              <div className="grid gap-3 rounded-lg border border-slate-200 p-4">
                {currentDefinition.supportsProductFilter && (
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    Productos (productIds)
                    <select
                      multiple
                      value={formState.productIds}
                      onChange={handleMultiSelectChange("productIds")}
                      className="h-32 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {productOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {currentDefinition.supportsUserFilter && (
                  <label className="flex flex-col gap-1 text-sm text-slate-600">
                    Responsables (userIds)
                    <select
                      multiple
                      value={formState.userIds}
                      onChange={handleMultiSelectChange("userIds")}
                      className="h-32 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {userOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {!currentDefinition.supportsProductFilter && !currentDefinition.supportsUserFilter && (
                  <p className="text-sm text-slate-500">Este tipo de reporte no requiere filtros adicionales.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Formato
                <select
                  value={formState.format}
                  onChange={handleInputChange("format")}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {REPORT_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Estado
                <select
                  value={formState.status}
                  onChange={handleInputChange("status")}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {REPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Metodo de entrega
                <select
                  value={formState.deliveryMethod}
                  onChange={handleInputChange("deliveryMethod")}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar reporte"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Mis reportes</h2>
          <span className="text-sm text-slate-500">{filteredReports.length} reporte(s)</span>
        </div>

        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Cargando reportes...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No encontramos reportes con los filtros actuales.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredReports.map((report) => {
              const statusClass =
                report.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : report.status === "draft"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-700";
              const definition = REPORT_DEFINITIONS.find((item) => item.value === report.type);
              return (
                <article
                  key={report.id}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">{report.name}</h3>
                        <p className="text-sm text-slate-500">{report.description || "Sin descripcion"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                        {REPORT_STATUS_OPTIONS.find((option) => option.value === report.status)?.label ?? report.status}
                      </span>
                    </div>

                    <div className="grid gap-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">Tipo:</span>
                        <span>{definition?.label ?? report.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">Formato:</span>
                        <span>{REPORT_FORMAT_OPTIONS.find((option) => option.value === report.format)?.label ?? report.format}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">Creador:</span>
                        <span>{report.createdByName ?? "No informado"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Rango:</span>
                        <p className="mt-1">
                          {report.filters.startDate ? formatDate(report.filters.startDate) : "Sin registrar"} - {report.filters.endDate ? formatDate(report.filters.endDate) : "Sin registrar"}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Filtros extra:</span>
                        <p className="mt-1">
                          Productos: {(report.filters.productIds ?? []).length > 0 ? (report.filters.productIds ?? []).join(", ") : "No aplica"}
                          <br />
                          Usuarios: {(report.filters.userIds ?? []).length > 0 ? (report.filters.userIds ?? []).join(", ") : "No aplica"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">Ultima ejecucion:</span>
                        <span>{formatDateTime(report.lastRunAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">Actualizado:</span>
                        <span>{formatDate(report.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleExecute(report)}
                      disabled={executingId === report.id}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {executingId === report.id ? "Generando..." : "Generar"}
                    </button>
                    {!report.virtual && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(report)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(report)}
                          disabled={deletingId === report.id}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === report.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
