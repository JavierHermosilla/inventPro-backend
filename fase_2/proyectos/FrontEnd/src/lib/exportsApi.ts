import api from "./api";

let exportsAvailabilityCache: boolean | null = null;

export async function checkExportsAvailability(): Promise<boolean> {
  if (exportsAvailabilityCache !== null) return exportsAvailabilityCache;
  try {
    const res = await api.get<{ ok?: boolean }>("/exports/ping", { timeout: 2000 });
    exportsAvailabilityCache = Boolean(res.data && (res.data as Record<string, unknown>).ok === true);
  } catch {
    exportsAvailabilityCache = false;
  }
  return exportsAvailabilityCache;
}

function extractFilenameFromDisposition(value?: string | null): string | null {
  if (!value) return null;
  try {
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(value);
    const raw = match?.[1] ?? match?.[2] ?? "";
    const decoded = decodeURIComponent(raw);
    return decoded || null;
  } catch {
    return null;
  }
}

async function downloadBlob(path: string, fallbackName: string, mimeHint: string) {
  const response = await api.get(path, { responseType: "blob" });
  const headers = response.headers as Record<string, string | undefined>;
  const disposition = headers["content-disposition"] ?? headers["Content-Disposition"];
  const contentType = headers["content-type"] ?? headers["Content-Type"] ?? mimeHint;

  const filename = extractFilenameFromDisposition(disposition) ?? fallbackName;
  const blob = new Blob([response.data], { type: contentType });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

export const exportsApi = {
  async downloadFullInventoryPDF() {
    const ok = await checkExportsAvailability();
    if (!ok) throw new Error("Exportación no disponible en el backend");
    const name = `full_inventory_${timestamp()}.pdf`;
    await downloadBlob("/exports/full-inventory.pdf", name, "application/pdf");
  },
  async downloadFullInventoryXLSX() {
    const ok = await checkExportsAvailability();
    if (!ok) throw new Error("Exportación no disponible en el backend");
    const name = `full_inventory_${timestamp()}.xlsx`;
    await downloadBlob(
      "/exports/full-inventory.xlsx",
      name,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  },
  async downloadFullInventoryCSV() {
    const ok = await checkExportsAvailability();
    if (!ok) throw new Error("Exportación no disponible en el backend");
    const name = `full_inventory_${timestamp()}.csv`;
    await downloadBlob("/exports/full-inventory.csv", name, "text/csv;charset=utf-8");
  },
};

export default exportsApi;
