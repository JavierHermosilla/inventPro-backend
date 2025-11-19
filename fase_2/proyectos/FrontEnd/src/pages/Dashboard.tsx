import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import dashboardApi, { type DashboardRecentOrder, type DashboardSummary } from "../lib/dashboardApi";
import type { OrderStatus } from "../lib/ordersApi";
import { productsApi, type ProductItem, type ProductListResult } from "../lib/productsApi";
import { categoriesApi, type CategoryItem, type CategoryListResult } from "../lib/categoriesApi";
import { suppliersApi, type SupplierItem, type SupplierListResult } from "../lib/suppliersApi";
import { usersApi, USER_ROLE_LABELS, type UserItem, type UserListResult } from "../lib/usersApi";
import { confirmAction, showError, showSuccess } from "../lib/alerts";
import { useAuthStore, type Role, type User as AuthUser } from "../store/auth";
import { useSettingsStore } from "../store/settings";

type KpiData = {
  totalProducts: number;
  lowStockItems: number;
  dailySalesCount: number;
  totalSalesCount: number;
};

type ApiOrderItem = {
  id?: string;
  productId?: string;
  quantity?: number | string | null;
  product?: {
    id?: string;
    name?: string | null;
    supplierId?: string | number | null;
    supplier?: { id?: string | number; name?: string | null } | null;
  } | null;
};

type ApiOrder = {
  id?: string;
  clientId?: string | null;
  createdAt?: string | null;
  status?: OrderStatus | null;
  client?: { name?: string | null; rut?: string | null } | null;
  customer?: { name?: string | null } | null;
  items?: ApiOrderItem[] | null;
};

type RecentOrder = {
  id: string;
  clientLabel: string;
  clientMeta: string | null;
  orderDate: string;
  status: OrderStatus;
};

type SystemUserRow = {
  id: string;
  name: string;
  roleLabel: string;
  contact: string | null;
};

type SupplierOrderRow = {
  id: string;
  supplier: string;
  date: string;
  status: OrderStatus;
  totalItems: number;
};

type CategoryStockRow = {
  id: string;
  label: string;
  percent: number;
  color: string;
};

const API_ENDPOINTS = {
  userProfile: "/auth/profile",
  orders: "/orders",
};

const LOW_STOCK_THRESHOLD = 10;
const MAX_RECENT_ORDERS = 5;
const MAX_SUPPLIER_ORDERS = 5;
const MAX_SYSTEM_USERS = 5;

const CATEGORY_COLOR_CLASSES = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-lime-500",
  "bg-fuchsia-500",
];

const STATUS_COLORS: Record<OrderStatus | "other", string> = {
  completed: "bg-emerald-500",
  processing: "bg-blue-500",
  pending: "bg-amber-500",
  cancelled: "bg-rose-500",
  other: "bg-slate-400",
};

const DEFAULT_KPIS: KpiData = {
  totalProducts: 0,
  lowStockItems: 0,
  dailySalesCount: 0,
  totalSalesCount: 0,
};

const formatNumber = (num: number) => new Intl.NumberFormat("es-CL").format(num);

const getStatusClasses = (status: OrderStatus, isDarkMode: boolean) => {
  if (isDarkMode) {
    switch (status) {
      case "completed":
        return "bg-emerald-500/25 text-emerald-100";
      case "processing":
        return "bg-blue-500/25 text-blue-100";
      case "pending":
        return "bg-amber-500/25 text-amber-100";
      case "cancelled":
        return "bg-rose-500/25 text-rose-100";
      default:
        return "bg-slate-700/60 text-slate-100";
    }
  }

  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case "completed":
      return "Completada";
    case "processing":
      return "En proceso";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fallbackClientName = (identifier?: string | null) => {
  if (!identifier) return "Cliente sin identificar";
  const clean = identifier.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean ? `Cliente ${clean.slice(0, 6)}` : "Cliente sin identificar";
};

const shortIdentifier = (value?: string | null) => {
  if (!value) return null;
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean ? clean.slice(0, 6) : null;
};

const buildClientDisplay = ({
  name,
  rut,
  fallbackId,
  orderId,
}: {
  name?: string | null;
  rut?: string | null;
  fallbackId?: string | null;
  orderId: string;
}) => {
  const safeName = name?.trim() || null;
  const safeRut = rut?.trim() || null;
  const fallback = fallbackId ?? orderId;
  const shortId = shortIdentifier(fallback);

  if (safeName && safeRut) {
    return { primary: safeName, secondary: safeRut };
  }

  if (safeName) {
    return { primary: safeName, secondary: shortId ? `ID: ${shortId}` : null };
  }

  if (safeRut) {
    return { primary: safeRut, secondary: shortId ? `ID: ${shortId}` : null };
  }

  return {
    primary: fallbackClientName(fallback),
    secondary: shortId ? `ID: ${shortId}` : null,
  };
};

const mapOrdersFromApi = (orders: ApiOrder[]): RecentOrder[] =>
  orders
    .filter((order): order is ApiOrder & { id: string } => Boolean(order?.id))
    .slice(0, MAX_RECENT_ORDERS)
    .map((order) => {
      const clientName = order.client?.name?.trim();
      const customerName = order.customer?.name?.trim();
      const clientRut = order.client?.rut?.trim();
      const { primary, secondary } = buildClientDisplay({
        name: clientName || customerName,
        rut: clientRut,
        fallbackId: order.clientId,
        orderId: order.id!,
      });
      return {
        id: order.id!,
        clientLabel: primary,
        clientMeta: secondary,
        orderDate: order.createdAt ?? new Date().toISOString(),
        status: (order.status ?? "pending") as OrderStatus,
      };
    });

const mapOrdersFromSummary = (orders: DashboardRecentOrder[]): RecentOrder[] =>
  orders
    .filter((order): order is DashboardRecentOrder & { id: string } => Boolean(order?.id))
    .slice(0, MAX_RECENT_ORDERS)
    .map((order) => {
      const { primary, secondary } = buildClientDisplay({
        name: order.clientName,
        rut: order.clientRut,
        fallbackId: order.clientId,
        orderId: order.id,
      });
      return {
        id: order.id,
        clientLabel: primary,
        clientMeta: secondary,
        orderDate: order.createdAt ?? new Date().toISOString(),
        status: order.status,
      };
    });

type KpiOverrides = Partial<Pick<KpiData, "totalProducts" | "lowStockItems" | "totalSalesCount" | "dailySalesCount">>;

const computeKpis = (
  products: ProductItem[] | null,
  orders: RecentOrder[] | null,
  overrides?: KpiOverrides
): KpiData => {
  const computed: KpiData = { ...DEFAULT_KPIS };

  if (products) {
    computed.totalProducts = products.length;
    computed.lowStockItems = products.filter((product) => Number(product.stock) < LOW_STOCK_THRESHOLD).length;
  }

  if (orders) {
    computed.totalSalesCount = orders.length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    computed.dailySalesCount = orders.reduce((acc, order) => {
      const createdAt = new Date(order.orderDate);
      if (Number.isNaN(createdAt.getTime())) return acc;
      return createdAt >= startOfToday ? acc + 1 : acc;
    }, 0);
  }

  if (overrides?.totalProducts !== undefined && overrides.totalProducts !== null) {
    computed.totalProducts = overrides.totalProducts;
  }
  if (overrides?.lowStockItems !== undefined && overrides.lowStockItems !== null) {
    computed.lowStockItems = overrides.lowStockItems;
  }
  if (overrides?.totalSalesCount !== undefined && overrides.totalSalesCount !== null) {
    computed.totalSalesCount = overrides.totalSalesCount;
  }
  if (overrides?.dailySalesCount !== undefined && overrides.dailySalesCount !== null) {
    computed.dailySalesCount = overrides.dailySalesCount;
  }

  return computed;
};

const buildSupplierMap = (suppliers: SupplierItem[]) => {
  const map = new Map<string, string>();
  suppliers.forEach((supplier) => {
    map.set(String(supplier.id), supplier.name);
  });
  return map;
};

const normalizeCategoryLabel = (
  categoryId: string | number | null | undefined,
  fallback: string | null,
  categories: CategoryItem[]
) => {
  if (categoryId) {
    const matching = categories.find((category) => category.id === categoryId);
    if (matching) return matching.name;
  }
  if (fallback) {
    const lower = fallback.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return "Sin categoria";
};

const computeCategoryDistribution = (products: ProductItem[], categories: CategoryItem[]): CategoryStockRow[] => {
  if (!products.length) return [];
  const totals = new Map<string, { label: string; stock: number }>();
  let totalStock = 0;

  products.forEach((product) => {
    const stockRaw = Number(product.stock);
    const stock = Number.isFinite(stockRaw) ? Math.max(0, stockRaw) : 0;
    if (stock <= 0) return;

    const categoryKey = product.categoryId ? String(product.categoryId) : product.categoryName ?? "uncategorized";
    const label = normalizeCategoryLabel(
      product.categoryId ? String(product.categoryId) : null,
      product.categoryName ?? null,
      categories
    );

    const current = totals.get(categoryKey) ?? { label, stock: 0 };
    current.stock += stock;
    totals.set(categoryKey, current);
    totalStock += stock;
  });

  if (totalStock <= 0) return [];

  return Array.from(totals.entries())
    .sort((a, b) => b[1].stock - a[1].stock)
    .map(([key, data], index) => ({
      id: key,
      label: data.label,
      percent: Math.max(1, Math.round((data.stock / totalStock) * 100)),
      color: CATEGORY_COLOR_CLASSES[index % CATEGORY_COLOR_CLASSES.length],
    }));
};

const mapUsersToRows = (users: UserItem[]): SystemUserRow[] =>
  users.slice(0, MAX_SYSTEM_USERS).map((user) => ({
    id: user.id,
    name: user.name,
    roleLabel: USER_ROLE_LABELS[user.role] ?? user.role,
    contact: user.email ?? user.username ?? null,
  }));

const mapSupplierOrders = (orders: ApiOrder[], suppliers: SupplierItem[]): SupplierOrderRow[] => {
  if (!orders.length) return [];
  const supplierMap = buildSupplierMap(suppliers);

  return orders
    .filter((order): order is ApiOrder & { id: string } => Boolean(order?.id))
    .slice(0, MAX_SUPPLIER_ORDERS)
    .map((order) => {
      const firstItem = order.items?.find((item) => item?.product?.supplierId || item?.product?.supplier?.id);
      const supplierId = firstItem?.product?.supplierId ?? firstItem?.product?.supplier?.id ?? null;
      const supplierName =
        (supplierId ? supplierMap.get(String(supplierId)) : undefined) ??
        firstItem?.product?.supplier?.name ??
        "Proveedor no asignado";

      const itemCount = order.items?.length ?? 0;

      return {
        id: order.id,
        supplier: supplierName,
        date: formatDateLabel(order.createdAt ?? undefined),
        status: (order.status ?? "pending") as OrderStatus,
        totalItems: itemCount,
      };
    });
};

const DashboardPage = () => {
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useSettingsStore((state) => state.appearance.theme);
  const isDarkMode = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authUser ?? null);
  const [kpis, setKpis] = useState<KpiData>(DEFAULT_KPIS);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUserRow[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrderRow[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<ProductItem[]>([]);
  const [categoryStock, setCategoryStock] = useState<CategoryStockRow[]>([]);
  const [dateTime, setDateTime] = useState(new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const profilePromise: Promise<AuthUser | null> = authUser
        ? Promise.resolve(authUser)
        : api.get<AuthUser>(API_ENDPOINTS.userProfile).then((res) => res.data);

      const [
        profileRes,
        summaryRes,
        ordersRes,
        productsRes,
        usersRes,
        suppliersRes,
        categoriesRes,
      ] = await Promise.allSettled([
        profilePromise,
        dashboardApi.summary(),
        api.get<ApiOrder[]>(API_ENDPOINTS.orders),
        productsApi.list({ limit: 200 }),
        usersApi.list({ limit: MAX_SYSTEM_USERS }),
        suppliersApi.list(),
        categoriesApi.list({ limit: 200 }),
      ] as const);

      if (!isMountedRef.current) return;

      const warnings = new Set<string>();

      if (profileRes.status === "fulfilled" && profileRes.value) {
        setCurrentUser(profileRes.value);
      } else if (!authUser) {
        warnings.add("perfil de usuario");
      }

      const overrides: KpiOverrides = {};
      let summaryRecentOrders: DashboardRecentOrder[] = [];
      let summaryLowStock: ProductItem[] = [];

      if (summaryRes.status === "fulfilled") {
        const summary: DashboardSummary = summaryRes.value;
        summaryRecentOrders = summary.recentOrders;
        summaryLowStock = summary.lowStockProducts;

        if (summary.totals.products !== null) {
          overrides.totalProducts = summary.totals.products;
        }
        if (summary.totals.orders !== null) {
          overrides.totalSalesCount = summary.totals.orders;
        }
        if (summary.lowStockProducts.length > 0) {
          overrides.lowStockItems = summary.lowStockProducts.length;
        }
      } else {
        warnings.add("resumen del dashboard");
      }

      let products: ProductItem[] = [];
      if (productsRes.status === "fulfilled") {
        const list: ProductListResult = productsRes.value;
        products = list.items;
      } else if (summaryLowStock.length > 0) {
        products = summaryLowStock;
        warnings.add("inventario completo");
      } else {
        warnings.add("inventario");
      }
      setInventoryProducts(products);

      let ordersPayload: ApiOrder[] = [];
      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value.data)) {
        ordersPayload = ordersRes.value.data;
      } else if (summaryRecentOrders.length === 0) {
        warnings.add("ordenes");
      }

      const recentOrdersData =
        ordersPayload.length > 0
          ? mapOrdersFromApi(ordersPayload)
          : summaryRecentOrders.length > 0
            ? mapOrdersFromSummary(summaryRecentOrders)
            : [];
      setRecentOrders(recentOrdersData);

      if (usersRes.status === "fulfilled") {
        const userList: UserListResult = usersRes.value;
        setSystemUsers(mapUsersToRows(userList.items));
      } else {
        setSystemUsers([]);
        warnings.add("usuarios del sistema");
      }

      const suppliers: SupplierItem[] =
        suppliersRes.status === "fulfilled" ? (suppliersRes.value as SupplierListResult).items : [];
      if (suppliersRes.status !== "fulfilled") {
        warnings.add("proveedores");
      }

      const supplierRows =
        ordersPayload.length > 0 ? mapSupplierOrders(ordersPayload, suppliers) : [];
      setSupplierOrders(supplierRows);
      if (supplierRows.length === 0) {
        warnings.add("ordenes a proveedores");
      }

      const categories: CategoryItem[] =
        categoriesRes.status === "fulfilled" ? (categoriesRes.value as CategoryListResult).items : [];
      if (categoriesRes.status !== "fulfilled") {
        warnings.add("categorias");
      }

      const distribution =
        products.length > 0 ? computeCategoryDistribution(products, categories) : [];
      setCategoryStock(distribution);
      if (products.length > 0 && distribution.length === 0) {
        warnings.add("distribucion de stock por categoria");
      }

      setKpis(computeKpis(products, recentOrdersData, overrides));

      if (warnings.size > 0) {
        setNotice("Algunos datos no se pudieron cargar completamente: " + Array.from(warnings).join(", ") + ".");
      } else {
        setNotice(null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("[dashboard] fetch error", err);
      setError("No se pudieron cargar los datos del dashboard. Verifique la conexion al backend o su sesion.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [authUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const orderStatusStats = useMemo(() => {
    const counts: Record<OrderStatus | "other", number> = {
      completed: 0,
      processing: 0,
      pending: 0,
      cancelled: 0,
      other: 0,
    };

    recentOrders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status] += 1;
      } else {
        counts.other += 1;
      }
    });

    const entries = (Object.keys(counts) as Array<keyof typeof counts>).map((key) => ({
      id: key,
      label: getStatusLabel(key as OrderStatus),
      value: counts[key],
      color: STATUS_COLORS[key] ?? STATUS_COLORS.other,
    }));

    const max = Math.max(...entries.map((entry) => entry.value), 1);
    return { entries, max, total: recentOrders.length };
  }, [recentOrders]);

  const handleLogout = useCallback(async () => {
    if (!isMountedRef.current || isLoggingOut) return;

    const confirmed = await confirmAction({
      title: "Cerrar sesion",
      text: "Estas seguro de que deseas cerrar tu sesion",
      confirmButtonText: "Si, cerrar sesion",
    });

    if (!confirmed) return;

    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      if (!isMountedRef.current) return;

      await showSuccess({
        title: "Sesion cerrada",
        text: "Has cerrado sesion correctamente.",
        confirmButtonText: "Ir a iniciar sesion",
      });

      if (!isMountedRef.current) return;
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error al cerrar sesion:", err);
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : "No se pudo cerrar la sesion. Intenta nuevamente.";
      if (isMountedRef.current) {
        setLogoutError(message);
      }
      await showError({
        title: "Error al cerrar sesion",
        text: message,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  }, [isLoggingOut, logout, navigate]);

  // Botón de exportar PDF retirado: generación desde Reportes

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando datos del dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 border border-red-300 rounded-xl shadow-lg">
        Error: {error}
      </div>
    );
  }

  const formattedTime = dateTime.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const formattedDate = dateTime.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const userDisplayName = currentUser?.name ?? "Usuario";
  const effectiveRole = (currentUser?.role ?? authUser?.role ?? "user") as Role;
  const isAdmin = effectiveRole === "admin";
  const isWarehouse = effectiveRole === "bodeguero";
  const userRoleLabel = USER_ROLE_LABELS[effectiveRole] ?? effectiveRole;
  const lowStockProducts = inventoryProducts.filter((product) => Number(product.stock) < LOW_STOCK_THRESHOLD);

  const cardClass = isDarkMode
    ? "rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg"
    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-lg";
  const compactCardClass = isDarkMode
    ? "rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg";
  const listItemClass = isDarkMode
    ? "flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-slate-100"
    : "flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700";

  const metricCards = [
    {
      id: "products",
      label: "Total de productos",
      detail: "Registros disponibles en el inventario.",
      value: formatNumber(kpis.totalProducts),
      lightWrapper: "bg-blue-50 text-blue-600",
      darkWrapper: "bg-blue-500/20 text-blue-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75h12m-12 0a2.25 2.25 0 0 1 2.25-2.25H15a2.25 2.25 0 0 1 2.25 2.25m-14.25 0v6.75A2.25 2.25 0 0 0 5.25 18.75H15a2.25 2.25 0 0 0 2.25-2.25V9.75m0 0h1.125A1.125 1.125 0 0 1 19.5 10.875V15M15 12h.008v.008H15V12Zm-3 0h.008v.008H12V12Zm-3 0h.008v.008H9V12Z" />
        </svg>
      ),
    },
    {
      id: "low-stock",
      label: "Stock bajo",
      detail: "Productos por debajo del umbral recomendado.",
      value: formatNumber(kpis.lowStockItems),
      lightWrapper: "bg-amber-50 text-amber-600",
      darkWrapper: "bg-amber-500/20 text-amber-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v-1.5a2.25 2.25 0 0 0-2.25-2.25h-3a2.25 2.25 0 0 0-2.25 2.25v.75m0 .75H7.5A2.25 2.25 0 0 0 5.25 9v5.25M8.25 6.75h7.5m0 0h.75A2.25 2.25 0 0 1 18.75 9v2.25M15 12h.008v.008H15V12Zm-3 0h.008v.008H12V12Zm-3 0h.008v.008H9V12Zm-3.75 2.25H3A1.5 1.5 0 0 0 1.5 15v2.25A1.5 1.5 0 0 0 3 18.75h.75M20.25 12h.75A2.25 2.25 0 0 1 23.25 14.25v3A2.25 2.25 0 0 1 21 19.5h-.75" />
        </svg>
      ),
    },
    {
      id: "daily-sales",
      label: "Ventas del dia",
      detail: "Transacciones registradas en la jornada.",
      value: formatNumber(kpis.dailySalesCount),
      lightWrapper: "bg-purple-50 text-purple-600",
      darkWrapper: "bg-purple-500/20 text-purple-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 13.5v3.75a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V13.5m16.5 0L12 6.75 3.75 13.5m16.5 0H3.75m6.75 3H13.5" />
        </svg>
      ),
    },
    {
      id: "total-sales",
      label: "Ventas totales",
      detail: "Pedidos despachados historicamente.",
      value: formatNumber(kpis.totalSalesCount),
      lightWrapper: "bg-rose-50 text-rose-600",
      darkWrapper: "bg-rose-500/20 text-rose-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.75A2.25 2.25 0 0 1 10.5 4.5h3a2.25 2.25 0 0 1 2.25 2.25v.75m2.25 12h-12A2.25 2.25 0 0 1 3.75 18V9.75A2.25 2.25 0 0 1 6 7.5h12a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25Zm-6-3a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
        </svg>
      ),
    },
  ];
  const metricCardsToShow = isWarehouse
    ? metricCards.filter((metric) => metric.id === "products" || metric.id === "low-stock")
    : metricCards;

  return (
    <div className="space-y-6">
      <section className={`${cardClass} md:p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500 dark:text-blue-300">Panel principal</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">Hola, {userDisplayName}</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Rol actual: <span className="font-semibold text-blue-600 dark:text-blue-300">{userRoleLabel}</span>. Gestiona tu inventario y pedidos desde aqui.
            </p>
            {isWarehouse ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-200">
                Vista de bodega: priorizamos stock bajo y órdenes pendientes.
              </p>
            ) : null}
            {notice ? (
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${
                  isDarkMode
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-100"
                    : "border border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isDarkMode ? "bg-amber-200" : "bg-amber-500"}`} />
                {notice}
              </div>
            ) : null}
          </div>
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
              <div className="text-right">
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formattedTime}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300 capitalize">{formattedDate}</p>
              </div>
              <div className="flex flex-col gap-2 sm:w-52">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
              </button>
              {logoutError ? <p className="text-center text-xs text-red-600">{logoutError}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCardsToShow.map((metric) => (
          <article
            key={metric.id}
            className={compactCardClass}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{metric.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{metric.detail}</p>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${isDarkMode ? metric.darkWrapper : metric.lightWrapper}`}>{metric.icon}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={`${cardClass} md:p-8`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ordenes recientes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">Ultimos movimientos registrados en el sistema.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              Ver todas
            </button>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Fecha</th>
                    <th className="py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-sm text-slate-700 dark:text-slate-100">
                      <td className="py-3">
                        <p className="font-medium">{order.clientLabel}</p>
                        {order.clientMeta ? (
                          <p className="text-xs text-slate-500 dark:text-slate-300">{order.clientMeta}</p>
                        ) : null}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-300">{formatDateLabel(order.orderDate)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(order.status, isDarkMode)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className={`rounded-xl border border-dashed p-6 text-center text-sm ${isDarkMode ? "border-slate-600 bg-slate-800/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"}`}
            >
              Aun no registras ordenes recientes.
            </p>
          )}
        </section>

        <aside className={`${cardClass} md:p-8 flex flex-col`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Estado de ordenes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-300">Resumen segun ultimas ordenes.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{orderStatusStats.total}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-300">ordenes</p>
            </div>
          </div>

          {orderStatusStats.total > 0 ? (
            <div className="mt-auto flex items-end gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
              {orderStatusStats.entries.map((entry) => (
                <div key={entry.id} className="flex-1">
                  <div
                    className={`rounded-t-lg ${entry.color} transition-all`}
                    style={{
                      height: `${(entry.value / orderStatusStats.max) * 100}%`,
                      minHeight: entry.value > 0 ? "16px" : "6px",
                    }}
                  />
                  <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-300">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{entry.value}</p>
                    <p className="capitalize">{entry.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
              Aun no hay ordenes para graficar.
            </p>
          )}
        </aside>

      </div>

      {isAdmin && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Usuarios del sistema</h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-300">Resumen</span>
              </div>
            </div>
            {systemUsers.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {systemUsers.map((user) => (
                  <li
                    key={user.id}
                    className={listItemClass}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {user.roleLabel}
                        {user.contact ? ` - ${user.contact}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Activo</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-100 p-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-300">
                No se encontraron usuarios para mostrar.
              </p>
            )}
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ordenes a proveedores</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-300">Periodo actual</span>
            </div>
            {supplierOrders.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {supplierOrders.map((order) => (
                  <li
                    key={order.id}
                    className={listItemClass}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.supplier}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">
                        {order.date}
                        {order.totalItems > 0 ? ` - ${order.totalItems} ${order.totalItems === 1 ? "producto" : "productos"}` : ""}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(order.status, isDarkMode)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-100 p-4 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-300">
                Aun no hay ordenes relacionadas a proveedores.
              </p>
            )}
          </section>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Distribucion de stock</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-300">Actualizado</span>
          </div>
          <div className="mt-5 space-y-5">
            {categoryStock.length > 0 ? (
              categoryStock.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span>{category.label}</span>
                    <span>{category.percent}%</span>
                  </div>
                  <div className={`h-2 w-full rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <div className={`${category.color} h-2 rounded-full`} style={{ width: `${category.percent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
                No hay stock suficiente para generar la distribucion.
              </p>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Productos con stock bajo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-300">Umbral configurado en {LOW_STOCK_THRESHOLD} unidades.</p>
            </div>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={listItemClass}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Stock actual: {product.stock}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isDarkMode ? "bg-amber-500/20 text-amber-200" : "bg-amber-100 text-amber-700"}`}>Revisar</span>
                </div>
              ))}
            </div>
          ) : (
            <p
              className={`mt-6 rounded-xl border border-dashed p-6 text-center text-sm ${isDarkMode ? "border-slate-600 bg-slate-800/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"}`}
            >
              No hay productos por debajo del umbral definido.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
