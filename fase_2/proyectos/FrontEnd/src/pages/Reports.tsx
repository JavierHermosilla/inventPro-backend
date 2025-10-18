import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import * as pdfMake from "pdfmake/build/pdfmake";
import { vfs as pdfMakeVfs } from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { confirmAction, showError, showInfo, showSuccess } from "../lib/alerts";

const pdfMakeWithVfs = pdfMake as typeof pdfMake & { vfs: Record<string, string> };
pdfMakeWithVfs.vfs = pdfMakeVfs;

type ReportType = "Ventas" | "Stock" | "Clientes" | "Proveedores" | "Movimientos";
type ReportFormat = "PDF" | "XLS (Excel)" | "CSV" | "Dashboard";
type ReportStatus = "Activo" | "Borrador" | "Archivado";
type DeliveryMethod = "Descarga Inmediata" | "Enviar por Email" | "Compartir Link";
type NumericFormat = "currency" | "number" | "percentage";

interface SummaryItem {
  label: string;
  value: string | number;
  format?: NumericFormat;
}

interface TableTemplate {
  headers: string[];
  rows: Array<Array<string | number>>;
  formatters?: Record<number, NumericFormat>;
  totals?: Array<{ label: string; value: number; format?: NumericFormat }>;
  columnWidths?: Array<number | "auto" | "*">;
}

interface ReportTemplate {
  summary: SummaryItem[];
  table: TableTemplate;
  normativeReferences: string[];
  notes: string[];
  legalLabel: string;
  recommendedRetention: string;
}

interface ReportFilters {
  dateRange: string;
  category: string;
}

interface ReportRecord {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  filters: ReportFilters;
  format: ReportFormat;
  status: ReportStatus;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastExecutedAt: string | null;
}

interface ReportFormState {
  name: string;
  description: string;
  type: ReportType;
  dateRange: string;
  category: string;
  format: ReportFormat;
  status: ReportStatus;
  deliveryMethod: DeliveryMethod;
}

const COMPANY_PROFILE = {
  businessName: "Invent Pro SpA",
  rut: "76.543.210-9",
  giro: "Servicios de Gestion de Inventario",
  address: "Av. Apoquindo 1234, Las Condes, Santiago",
  email: "contacto@inventpro.cl",
  phone: "+56 2 2345 6789",
};

const FILTER_HINTS: Record<ReportType, { label: string; placeholder: string }> = {
  Ventas: { label: "Filtro: Segmentos o canales", placeholder: "Ej: Retail, Mayorista, Ecommerce" },
  Stock: { label: "Filtro: Bodegas o categorias", placeholder: "Ej: Bodega Central, Criticos" },
  Clientes: { label: "Filtro: Segmentos de clientes", placeholder: "Ej: VIP, Zona norte" },
  Proveedores: { label: "Filtro: Rubros o criticidad", placeholder: "Ej: Logistica, Embalajes" },
  Movimientos: { label: "Filtro: Tipos de movimiento", placeholder: "Ej: Transferencias, Ajustes" },
};

const REPORT_TYPES: ReportType[] = ["Ventas", "Stock", "Clientes", "Proveedores", "Movimientos"];
const REPORT_FORMATS: ReportFormat[] = ["PDF", "XLS (Excel)", "CSV", "Dashboard"];
const REPORT_STATUSES: ReportStatus[] = ["Activo", "Borrador", "Archivado"];
const DELIVERY_METHODS: DeliveryMethod[] = ["Descarga Inmediata", "Enviar por Email", "Compartir Link"];
const REPORT_TEMPLATES: Record<ReportType, ReportTemplate> = {
  Ventas: {
    summary: [
      { label: "Documentos tributarios", value: 4, format: "number" },
      { label: "Ventas netas", value: 4520000, format: "currency" },
      { label: "IVA debito", value: 741000, format: "currency" },
    ],
    table: {
      headers: ["Folio", "Fecha emision", "Cliente / RUT", "Tipo doc.", "Monto neto", "IVA", "Total"],
      rows: [
        ["33", "05-04-2025", "Comercial Andes Ltda.\n76.456.789-0", "Factura afecta", 1850000, 351500, 2201500],
        ["34", "15-05-2025", "Retail Patagonia SpA\n77.234.567-2", "Factura exenta", 620000, 0, 620000],
        ["35", "21-05-2025", "Municipalidad de Santiago\n69.123.456-K", "Factura afecta", 780000, 148200, 928200],
        ["36", "10-06-2025", "Servicios del Norte Ltda.\n89.987.654-1", "Factura afecta", 1270000, 241300, 1511300],
      ],
      formatters: { 4: "currency", 5: "currency", 6: "currency" },
      totals: [
        { label: "Total ventas netas", value: 4520000, format: "currency" },
        { label: "Total IVA debito", value: 741000, format: "currency" },
        { label: "Total ventas brutas", value: 5261000, format: "currency" },
      ],
      columnWidths: ["auto", "auto", "*", "auto", "auto", "auto", "auto"],
    },
    normativeReferences: [
      "Formato alineado con Resolucion Exenta SII 45/2003 para libros de ventas electronicos.",
      "Pensado para conciliacion con Formulario 29 y cruces de DTE aceptados por el SII.",
    ],
    notes: [
      "Validar folios y estados de los DTE antes de distribuir el reporte.",
      "Conservar respaldos XML y comprobantes por 6 anos en carpeta tributaria.",
    ],
    legalLabel: "Encargado de contabilidad",
    recommendedRetention: "Mantener por 6 anos segun articulo 17 del Codigo Tributario.",
  },
  Stock: {
    summary: [
      { label: "Items revisados", value: 5, format: "number" },
      { label: "Valor inventario", value: 25530000, format: "currency" },
      { label: "Items bajo minimo", value: 1, format: "number" },
    ],
    table: {
      headers: ["SKU", "Producto", "Bodega", "Stock actual", "Stock minimo", "Diferencia", "Valorizado"],
      rows: [
        ["SKU-0012", "Notebook Dell Latitude 3420", "Bodega Central", 24, 10, 14, 17280000],
        ["SKU-0045", "Audifonos Logitech Zone", "Bodega Central", 45, 30, 15, 2250000],
        ["SKU-0098", "Impresora HP LaserJet Pro", "Bodega Nunoa", 8, 12, -4, 960000],
        ["SKU-0102", "Toner HP 30A", "Bodega Nunoa", 60, 40, 20, 1800000],
        ["SKU-0120", "Silla Ergonomica Active", "Centro Distribucion", 18, 15, 3, 3240000],
      ],
      formatters: { 3: "number", 4: "number", 5: "number", 6: "currency" },
      totals: [{ label: "Inventario valorizado total", value: 25530000, format: "currency" }],
      columnWidths: ["auto", "*", "auto", "auto", "auto", "auto", "auto"],
    },
    normativeReferences: [
      "Compatible con Resolucion Exenta SII 59/2020 sobre control de inventarios.",
      "Cubre requisitos de NIC 2 y boletines del Colegio de Contadores para valorizacion.",
    ],
    notes: [
      "Respaldar ajustes con actas firmadas y evidencia fotografica.",
      "Conciliar con Kardex y sistemas WMS antes de cierre mensual.",
    ],
    legalLabel: "Jefe de logistica",
    recommendedRetention: "Resguardar por 6 anos conforme a instrucciones del SII.",
  },
  Clientes: {
    summary: [
      { label: "Clientes activos", value: 128, format: "number" },
      { label: "RUT validados", value: 118, format: "number" },
      { label: "Ticket promedio 90 dias", value: 265000, format: "currency" },
    ],
    table: {
      headers: ["Cliente", "RUT", "Segmento", "Fecha registro", "Estado", "Ultima compra"],
      rows: [
        ["Constructora Los Andes Ltda.", "76.145.230-4", "B2B", "12-02-2023", "Activo", "24-06-2025 - $1.280.000"],
        ["Retail Patagonia S.A.", "77.234.567-2", "Retail", "03-08-2022", "Activo", "18-06-2025 - $980.000"],
        ["Municipalidad de Rancagua", "69.654.320-1", "Institucional", "25-10-2021", "Suspendido", "08-05-2025 - $0"],
        ["Servicios Medicos Vida", "78.345.210-7", "Salud", "19-03-2024", "Activo", "27-06-2025 - $560.000"],
      ],
      columnWidths: ["*", "auto", "auto", "auto", "auto", "*"],
    },
    normativeReferences: [
      "Considera obligaciones de Ley 19.496 y Ley 19.628 para tratamiento de datos de clientes.",
      "Formato util para respaldar auditorias de SERNAC y atencion de reclamos.",
    ],
    notes: [
      "Conservar consentimientos y contratos vigentes por segmento.",
      "Anexar evidencia de cumplimiento a solicitudes de eliminacion o bloqueo.",
    ],
    legalLabel: "Encargado de clientes",
    recommendedRetention: "Custodiar antecedentes por al menos 5 anos.",
  },
  Proveedores: {
    summary: [
      { label: "Proveedores activos", value: 18, format: "number" },
      { label: "Plazo pago promedio (dias)", value: 32, format: "number" },
      { label: "Compras ultimos 30 dias", value: 3150000, format: "currency" },
    ],
    table: {
      headers: ["Proveedor", "RUT", "Rubro", "Condicion de pago", "Ultimo documento", "Monto", "Estado"],
      rows: [
        ["Logistica Sur S.A.", "76.987.321-0", "Transporte", "30 dias factura", "Factura 347 - 05-06-2025", 1280000, "Al dia"],
        ["Envases Andinos Ltda.", "78.123.456-5", "Embalajes", "60 dias factura", "Factura 892 - 18-05-2025", 560000, "Pendiente"],
        ["Tecnored Chile SpA", "76.543.980-2", "Tecnologia", "Contado 10 dias", "Factura 128 - 25-06-2025", 980000, "Al dia"],
        ["Insumos Medicos Vida", "77.210.345-8", "Insumos", "30 dias factura", "Factura 564 - 30-04-2025", 330000, "En disputa"],
      ],
      formatters: { 5: "currency" },
      totals: [{ label: "Total comprometido ultimos 30 dias", value: 3150000, format: "currency" }],
      columnWidths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
    },
    normativeReferences: [
      "Da soporte al cumplimiento de la Ley 21.131 de Pago a 30 dias.",
      "Permite documentar relaciones comerciales frente a fiscalizaciones del SII.",
    ],
    notes: [
      "Registrar acuerdos contractuales y evidencia de pagos oportunos.",
      "Resguardar respaldos bancarios en caso de reclamos por interes moratorio.",
    ],
    legalLabel: "Encargado de abastecimiento",
    recommendedRetention: "Mantener documentacion por al menos 6 anos.",
  },
  Movimientos: {
    summary: [
      { label: "Movimientos auditados", value: 18, format: "number" },
      { label: "Stock ajustado (unid)", value: 124, format: "number" },
      { label: "Diferencia valorizada", value: 215000, format: "currency" },
    ],
    table: {
      headers: ["Fecha", "Tipo", "Documento", "Origen", "Destino", "Responsable", "Observaciones"],
      rows: [
        ["03-06-2025", "Ingreso por compra", "Factura 347", "Proveedor externo", "Bodega Central", "Maria Rebolledo", "Ingreso validado con guia de despacho electronica"],
        ["08-06-2025", "Transferencia interna", "TI-2025-018", "Bodega Central", "Bodega Nunoa", "Carlos Ibanez", "Traslado autorizado por jefatura de logistica"],
        ["12-06-2025", "Ajuste inventario", "AJ-2025-009", "Bodega Nunoa", "Bodega Nunoa", "Maria Rebolledo", "Regularizacion por merma certificada"],
        ["24-06-2025", "Devolucion cliente", "NC 125-2025", "Cliente Retail Patagonia", "Bodega Central", "Patricio Munoz", "Ingreso asociado a nota de credito electronica"],
      ],
      columnWidths: ["auto", "auto", "auto", "auto", "auto", "auto", "*"],
    },
    normativeReferences: [
      "Trazabilidad conforme a Resolucion Exenta SII 59/2020.",
      "Considera recomendaciones NIC 2 para ajustes y devoluciones.",
    ],
    notes: [
      "Mantener guias, actas y fotos como respaldo de cada movimiento extraordinario.",
      "Conciliar con ERP o WMS antes de enviar informacion a terceros.",
    ],
    legalLabel: "Supervisor de inventario",
    recommendedRetention: "Guardar respaldos fisicos y digitales por 6 anos.",
  },
};
const initialReports: ReportRecord[] = [
  {
    id: "rpt-ventas-q2",
    name: "Ventas Trimestrales Q2",
    type: "Ventas",
    description: "Analisis de ventas del segundo trimestre.",
    filters: { dateRange: "01/04/2025 - 30/06/2025", category: "Canales: Retail y Mayoristas" },
    format: "PDF",
    status: "Activo",
    deliveryMethod: "Descarga Inmediata",
    createdAt: "2025-07-01T12:20:00-04:00",
    updatedAt: "2025-07-01T12:20:00-04:00",
    createdBy: "Admin Admin",
    lastExecutedAt: null,
  },
  {
    id: "rpt-stock-minimo",
    name: "Productos con Poco Stock",
    type: "Stock",
    description: "Listado de productos bajo el stock minimo de seguridad.",
    filters: { dateRange: "Ultimos 30 dias", category: "Bodega Central y Nunoa" },
    format: "XLS (Excel)",
    status: "Borrador",
    deliveryMethod: "Descarga Inmediata",
    createdAt: "2025-06-15T09:35:00-04:00",
    updatedAt: "2025-06-22T08:10:00-04:00",
    createdBy: "Admin Admin",
    lastExecutedAt: null,
  },
];

const initialFormState: ReportFormState = {
  name: "",
  description: "",
  type: "Ventas",
  dateRange: "",
  category: "",
  format: "PDF",
  status: "Activo",
  deliveryMethod: "Descarga Inmediata",
};

const formatNumeric = (value: number, format: NumericFormat = "number") => {
  if (format === "currency") {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "percentage") {
    return `${new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
  }
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value);
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Sin ejecutar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const ensureId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rpt-${Date.now()}`;
};
const buildDocDefinition = (report: ReportRecord): TDocumentDefinitions => {
  const template = REPORT_TEMPLATES[report.type];
  if (!template) {
    throw new Error(`No existe plantilla para el tipo ${report.type}.`);
  }

  const summaryContent: Content | null =
    template.summary.length > 0
      ? {
          columns: template.summary.map((item) => ({
            width: "*",
            stack: [
              { text: item.label, style: "summaryLabel" },
              {
                text: typeof item.value === "number" ? formatNumeric(item.value, item.format) : item.value,
                style: "summaryValue",
              },
            ],
          })),
          columnGap: 12,
          margin: [0, 12, 0, 12],
        }
      : null;

  const tableBody = [
    template.table.headers.map((header) => ({ text: header, style: "tableHeader" })),
    ...template.table.rows.map((row) =>
      row.map((cell, columnIndex) => {
        if (typeof cell === "number") {
          const formatType = template.table.formatters?.[columnIndex] ?? "number";
          return { text: formatNumeric(cell, formatType), style: "tableCell" };
        }
        return { text: cell, style: "tableCell" };
      })
    ),
  ];

  const dataTable: Content = {
    table: {
      headerRows: 1,
      widths: template.table.columnWidths ?? template.table.headers.map(() => "*"),
      body: tableBody,
    },
    layout: {
      fillColor: (rowIndex: number) => {
        if (rowIndex === 0) return "#1d4ed8";
        return rowIndex % 2 === 0 ? "#f8fafc" : null;
      },
      hLineColor: () => "#e2e8f0",
      vLineColor: () => "#e2e8f0",
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
  };

  const totalsTable: Content | null =
    template.table.totals && template.table.totals.length > 0
      ? {
          table: {
            widths: ["*", "auto"],
            body: template.table.totals.map((total) => [
              { text: total.label, style: "totalLabel" },
              { text: formatNumeric(total.value, total.format ?? "currency"), style: "totalValue" },
            ]),
          },
          layout: "noBorders",
          margin: [0, 8, 0, 16],
        }
      : null;

  const normativeList: Content | null =
    template.normativeReferences.length > 0
      ? {
          ul: template.normativeReferences.map((item) => ({ text: item, style: "listItem" })),
          margin: [0, 0, 0, 12],
        }
      : null;

  const notesList: Content | null =
    template.notes.length > 0
      ? {
          ul: template.notes.map((item) => ({ text: item, style: "listItem" })),
          margin: [0, 0, 0, 12],
        }
      : null;

  const now = new Date();

  const infoTable: Content = {
    table: {
      widths: ["auto", "*", "auto", "*"],
      body: [
        [
          { text: "Estado", style: "labelCell" },
          { text: report.status, style: "valueCell" },
          { text: "Formato de salida", style: "labelCell" },
          { text: report.format, style: "valueCell" },
        ],
        [
          { text: "Metodo de entrega", style: "labelCell" },
          { text: report.deliveryMethod, style: "valueCell" },
          { text: "Ultima ejecucion", style: "labelCell" },
          { text: formatDateTime(report.lastExecutedAt), style: "valueCell" },
        ],
        [
          { text: "Creado por", style: "labelCell" },
          { text: report.createdBy, style: "valueCell" },
          { text: "Actualizado", style: "labelCell" },
          { text: formatDateTime(report.updatedAt), style: "valueCell" },
        ],
        [
          { text: "Filtros aplicados", style: "labelCell" },
          {
            text: [
              { text: "Rango: ", bold: true },
              report.filters.dateRange || "Sin definir",
              "\n",
              { text: "Filtro adicional: ", bold: true },
              report.filters.category || "Sin definir",
            ],
            style: "valueCell",
          },
          { text: "Responsable legal", style: "labelCell" },
          { text: template.legalLabel, style: "valueCell" },
        ],
      ],
    },
    layout: "lightHorizontalLines",
    margin: [0, 16, 0, 16],
  };

  const signatureBlock: Content = {
    columns: [
      {
        width: "*",
        stack: [
          {
            canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: "#94a3b8" }],
            margin: [0, 32, 0, 4],
          },
          { text: template.legalLabel, style: "signatureLabel" },
          { text: "Nombre y firma", style: "signatureHint" },
        ],
      },
      {
        width: "*",
        stack: [
          { text: "Observaciones adicionales", style: "summaryLabel" },
          {
            text: "______________________________________________\n______________________________________________",
            margin: [0, 12, 0, 0],
            style: "valueCell",
          },
        ],
      },
    ],
    columnGap: 32,
    margin: [0, 24, 0, 0],
  };

  const content: Content[] = [
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: COMPANY_PROFILE.businessName, style: "companyName" },
            { text: `RUT: ${COMPANY_PROFILE.rut}`, style: "companyMeta" },
            { text: COMPANY_PROFILE.giro, style: "companyMeta" },
            { text: COMPANY_PROFILE.address, style: "companyMeta" },
            { text: `Contacto: ${COMPANY_PROFILE.email} - ${COMPANY_PROFILE.phone}`, style: "companyMeta" },
          ],
        },
        {
          width: "auto",
          stack: [
            { text: "Fecha de generacion", style: "summaryLabel" },
            {
              text: now.toLocaleString("es-CL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              style: "valueCell",
            },
            { text: "Periodo informado", style: "summaryLabel", margin: [0, 12, 0, 0] },
            { text: report.filters.dateRange || "No declarado", style: "valueCell" },
          ],
          alignment: "right",
        },
      ],
      columnGap: 16,
      margin: [0, 0, 0, 16],
    },
    { text: report.name, style: "headerTitle" },
    { text: `Tipo de reporte: ${report.type}`, style: "subtitle" },
    { text: report.description || "Sin descripcion registrada.", style: "paragraph" },
    infoTable,
  ];

  if (summaryContent) {
    content.push(summaryContent);
  }
  if (normativeList) {
    content.push({ text: "Resumen normativo", style: "sectionTitle" });
    content.push(normativeList);
  }
  if (notesList) {
    content.push({ text: "Notas operativas", style: "sectionTitle" });
    content.push(notesList);
  }

  content.push({ text: "Detalle del reporte", style: "sectionTitle" });
  content.push(dataTable);
  if (totalsTable) {
    content.push(totalsTable);
  }
  content.push({ text: template.recommendedRetention, style: "retentionNote" });
  content.push(signatureBlock);

  return {
    info: {
      title: `Reporte ${report.name}`,
      author: COMPANY_PROFILE.businessName,
      subject: `Reporte ${report.type}`,
    },
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    header: (currentPage) =>
      currentPage > 1
        ? {
            columns: [
              { text: COMPANY_PROFILE.businessName, style: "headerCompany", margin: [40, 20, 0, 0] },
              { text: `RUT ${COMPANY_PROFILE.rut}`, style: "headerCompany", alignment: "right", margin: [0, 20, 40, 0] },
            ],
          }
        : undefined,
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Respaldo normativo: ${template.recommendedRetention}`, style: "footerText" },
        { text: `Pagina ${currentPage} de ${pageCount}`, alignment: "right", style: "footerText" },
      ],
      margin: [40, 0, 40, 30],
    }),
    content,
    styles: {
      headerTitle: { fontSize: 18, bold: true, color: "#0f172a", margin: [0, 0, 0, 8] },
      subtitle: { fontSize: 12, bold: true, color: "#2563eb", margin: [0, 0, 0, 12] },
      paragraph: { fontSize: 10, color: "#475569", margin: [0, 0, 0, 12] },
      sectionTitle: { fontSize: 12, bold: true, color: "#1f2937", margin: [0, 18, 0, 8] },
      summaryLabel: { fontSize: 9, color: "#64748b", bold: true },
      summaryValue: { fontSize: 12, bold: true, color: "#0f172a", margin: [0, 4, 0, 0] },
      tableHeader: { bold: true, color: "#ffffff", fontSize: 9 },
      tableCell: { fontSize: 9, color: "#1f2937" },
      totalLabel: { fontSize: 9, color: "#475569", bold: true, margin: [0, 2, 0, 2] },
      totalValue: { fontSize: 10, bold: true, color: "#0f172a", alignment: "right", margin: [0, 2, 0, 2] },
      listItem: { fontSize: 9, color: "#1f2937", margin: [0, 2, 0, 2] },
      labelCell: { fontSize: 9, color: "#1f2937", bold: true },
      valueCell: { fontSize: 9, color: "#334155" },
      companyName: { fontSize: 14, bold: true, color: "#0f172a" },
      companyMeta: { fontSize: 9, color: "#475569", margin: [0, 2, 0, 0] },
      headerCompany: { fontSize: 9, color: "#475569" },
      footerText: { fontSize: 8, color: "#94a3b8" },
      retentionNote: { fontSize: 9, color: "#0f172a", italics: true, margin: [0, 8, 0, 0] },
      signatureLabel: { fontSize: 9, bold: true, color: "#1f2937", margin: [0, 4, 0, 0] },
      signatureHint: { fontSize: 8, color: "#94a3b8" },
    },
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.3,
    },
  };
};
export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>(initialReports);
  const [formState, setFormState] = useState<ReportFormState>(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) => {
      const text = [
        report.name,
        report.type,
        report.description,
        report.status,
        report.createdBy,
        report.filters.dateRange,
        report.filters.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }, [reports, searchTerm]);

  const handleInputChange =
    (field: keyof ReportFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target;
      setFormState((prev) => ({
        ...prev,
        [field]: value as ReportFormState[typeof field],
      }));
    };

  const handleOpenForm = () => {
    setFormState(initialFormState);
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formState.name.trim();
    if (!name) {
      await showError({ title: "Nombre requerido", text: "Debes indicar un nombre para el reporte." });
      return;
    }
    if (!formState.dateRange.trim()) {
      await showError({ title: "Rango requerido", text: "Define un rango de fechas para el analisis." });
      return;
    }

    const filters: ReportFilters = {
      dateRange: formState.dateRange.trim(),
      category: formState.category.trim(),
    };

    if (editingId) {
      setReports((prev) =>
        prev.map((report) =>
          report.id === editingId
            ? {
                ...report,
                name,
                description: formState.description.trim(),
                type: formState.type,
                filters,
                format: formState.format,
                status: formState.status,
                deliveryMethod: formState.deliveryMethod,
                updatedAt: new Date().toISOString(),
              }
            : report
        )
      );
      await showSuccess({ title: "Reporte actualizado", text: "Los cambios se guardaron correctamente." });
    } else {
      const nowIso = new Date().toISOString();
      const newReport: ReportRecord = {
        id: ensureId(),
        name,
        description: formState.description.trim(),
        type: formState.type,
        filters,
        format: formState.format,
        status: formState.status,
        deliveryMethod: formState.deliveryMethod,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: "Admin Admin",
        lastExecutedAt: null,
      };
      setReports((prev) => [newReport, ...prev]);
      await showSuccess({ title: "Reporte creado", text: "El reporte se agrego a la bandeja de reportes." });
    }

    setFormState(initialFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (report: ReportRecord) => {
    setFormState({
      name: report.name,
      description: report.description,
      type: report.type,
      dateRange: report.filters.dateRange,
      category: report.filters.category,
      format: report.format,
      status: report.status,
      deliveryMethod: report.deliveryMethod,
    });
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleDelete = async (report: ReportRecord) => {
    const confirmed = await confirmAction({
      title: `Eliminar el reporte "${report.name}"?`,
      text: "Esta accion no se puede deshacer.",
      confirmButtonText: "Si, eliminar",
    });
    if (!confirmed) return;
    setDeletingId(report.id);
    setReports((prev) => prev.filter((item) => item.id !== report.id));
    await showSuccess({ title: "Reporte eliminado", text: "El reporte se elimino correctamente." });
    setDeletingId(null);
  };

  const handleExecute = async (report: ReportRecord) => {
    if (report.format !== "PDF") {
      await showInfo({
        title: "Formato no disponible",
        text: "Por ahora la generacion normativa esta disponible solo en PDF.",
      });
      return;
    }
    setExecutingId(report.id);
    try {
      const definition = buildDocDefinition(report);
      const filename = `reporte-${toSlug(report.name)}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdfMake.createPdf(definition).download(filename);
      const stamp = new Date().toISOString();
      setReports((prev) =>
        prev.map((item) => (item.id === report.id ? { ...item, lastExecutedAt: stamp, updatedAt: stamp } : item))
      );
      await showSuccess({ title: "Reporte generado", text: "Se descargo el PDF correctamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible generar el PDF.";
      await showError({ title: "Error al generar", text: message });
    } finally {
      setExecutingId(null);
    }
  };

  const handleCancel = () => {
    setFormState(initialFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const secondaryFilterConfig = FILTER_HINTS[formState.type];

  const statusBadgeClass = (status: ReportStatus) => {
    if (status === "Activo") return "bg-emerald-100 text-emerald-700";
    if (status === "Borrador") return "bg-amber-100 text-amber-700";
    return "bg-slate-200 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestion de Reportes</h1>
          <p className="text-sm text-slate-500">
            Crea, gestiona y descarga reportes personalizados con enfoque normativo chileno.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-blue-900 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Buenas practicas normativas</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Los reportes PDF incluyen encabezados con RUT, periodo informado, detalle transaccional y notas de
          respaldo, siguiendo orientaciones del Servicio de Impuestos Internos. Verifica que los datos coincidan con
          tus libros electronicos antes de compartirlos.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>Incluye datos exigidos por Resolucion Exenta SII 45/2003 y Ley 21.131.</li>
          <li>Conserva respaldos digitales por al menos 6 anos segun el Codigo Tributario.</li>
          <li>Coordina con backend si necesitas integrar fuentes oficiales (ERP, ETL, XML DTE).</li>
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <button
          type="button"
          onClick={handleOpenForm}
          className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow transition hover:border-blue-400 hover:text-blue-600"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-3xl text-blue-600">
            +
          </span>
          <span className="text-lg font-semibold text-slate-700">Crear nuevo reporte</span>
          <span className="text-sm">Configura filtros y formato antes de exportar.</span>
        </button>

        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-800">Buscar reportes existentes</h3>
          <p className="text-sm text-slate-500">Filtra por nombre, tipo, creador o descripcion.</p>
          <div className="mt-4">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar reporte..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </section>

      {showForm && (
        <section className="grid gap-6 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? "Editar reporte" : "Crear nuevo reporte"}
              </h3>
              <p className="text-sm text-slate-500">
                Completa los campos requeridos para mantener el cumplimiento normativo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="report-name" className="text-xs font-semibold uppercase text-slate-500">
                  Nombre del reporte
                </label>
                <input
                  id="report-name"
                  type="text"
                  value={formState.name}
                  onChange={handleInputChange("name")}
                  placeholder="Ej: Inventario por categoria"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="report-type" className="text-xs font-semibold uppercase text-slate-500">
                  Tipo de reporte
                </label>
                <select
                  id="report-type"
                  value={formState.type}
                  onChange={handleInputChange("type")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="report-description" className="text-xs font-semibold uppercase text-slate-500">
                  Descripcion breve
                </label>
                <textarea
                  id="report-description"
                  value={formState.description}
                  onChange={handleInputChange("description")}
                  placeholder="Describe el enfoque del reporte."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="report-daterange" className="text-xs font-semibold uppercase text-slate-500">
                  Filtro: rango de fechas
                </label>
                <input
                  id="report-daterange"
                  type="text"
                  value={formState.dateRange}
                  onChange={handleInputChange("dateRange")}
                  placeholder="Ej: 01/01/2025 - 31/03/2025"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="report-category" className="text-xs font-semibold uppercase text-slate-500">
                  {secondaryFilterConfig.label}
                </label>
                <input
                  id="report-category"
                  type="text"
                  value={formState.category}
                  onChange={handleInputChange("category")}
                  placeholder={secondaryFilterConfig.placeholder}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="report-format" className="text-xs font-semibold uppercase text-slate-500">
                  Formato de salida
                </label>
                <select
                  id="report-format"
                  value={formState.format}
                  onChange={handleInputChange("format")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {REPORT_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="report-status" className="text-xs font-semibold uppercase text-slate-500">
                  Estado
                </label>
                <select
                  id="report-status"
                  value={formState.status}
                  onChange={handleInputChange("status")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {REPORT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="report-delivery" className="text-xs font-semibold uppercase text-slate-500">
                  Metodo de entrega
                </label>
                <select
                  id="report-delivery"
                  value={formState.deliveryMethod}
                  onChange={handleInputChange("deliveryMethod")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {DELIVERY_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {editingId ? "Guardar cambios" : "Guardar reporte"}
              </button>
            </div>
          </form>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <h4 className="font-semibold text-slate-700">Guia rapida</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Incluye razon social, RUT y giro en cada reporte PDF.</li>
              <li>Define rangos y filtros claros para respaldar fiscalizaciones.</li>
              <li>Coordina integraciones con backend antes de consumir datos oficiales.</li>
            </ul>
          </aside>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Mis reportes creados</h2>
          <span className="text-sm text-slate-500">{filteredReports.length} reporte(s)</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No encontramos reportes con los criterios indicados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredReports.map((report) => (
              <article
                key={report.id}
                className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">{report.name}</h3>
                      <p className="text-sm text-slate-500">{report.description || "Sin descripcion registrada."}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="grid gap-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Tipo:</span>
                      <span>{report.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Formato:</span>
                      <span>{report.format}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Creador:</span>
                      <span>{report.createdBy}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Filtros:</span>
                      <p className="mt-1">
                        <span className="text-slate-600">Rango:</span> {report.filters.dateRange || "-"}
                        <br />
                        <span className="text-slate-600">Adicional:</span> {report.filters.category || "-"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Ultima ejecucion:</span>
                      <span>{formatDateTime(report.lastExecutedAt)}</span>
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
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                  >
                    {executingId === report.id ? "Generando..." : "Ejecutar"}
                  </button>
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
                    className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {deletingId === report.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
