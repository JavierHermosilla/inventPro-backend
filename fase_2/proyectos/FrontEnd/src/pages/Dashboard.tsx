import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { confirmAction, showError, showSuccess } from "../lib/alerts";
import { useAuthStore } from "../store/auth";
import { productsApi, type ProductItem } from "../lib/productsApi";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

type User = {
  name: string;
  role: string;
};

type KpiData = {
  totalProducts: number;
  lowStockItems: number;
  dailySalesCount: number;
  totalSalesCount: number;
};

type ApiOrder = {
  id?: string;
  clientId?: string;
  createdAt?: string;
  status?: OrderStatus;
  client?: { name?: string | null } | null;
  customer?: { name?: string | null } | null;
};

type RecentOrder = {
  id: string;
  clientName: string;
  orderDate: string;
  status: OrderStatus;
};

type SystemUserRow = {
  id: string;
  name: string;
  role: string;
  area: string;
};

type SupplierOrderRow = {
  id: string;
  supplier: string;
  date: string;
  status: OrderStatus;
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

const MOCK_USER: User = { name: "Usuario Invitado", role: "Invitado" };
const MOCK_KPIS: KpiData = {
  totalProducts: 5430,
  lowStockItems: 85,
  dailySalesCount: 173,
  totalSalesCount: 12450,
};

const SIMULATED_ORDER_BLUEPRINT: Array<{ id: string; clientName: string; daysAgo: number; status: OrderStatus }> = [
  { id: "sim-1", clientName: "Distribuidora Andina", daysAgo: 1, status: "completed" },
  { id: "sim-2", clientName: "Comercial Los Robles", daysAgo: 2, status: "processing" },
  { id: "sim-3", clientName: "Ferreteria El Molino", daysAgo: 3, status: "pending" },
  { id: "sim-4", clientName: "Retail Patagonia", daysAgo: 4, status: "cancelled" },
];

const SIMULATED_PRODUCTS: ProductItem[] = [
  {
    id: "sim-prod-1",
    nombre: "Caja Organizadora",
    stock: 42,
    descripcion: "Producto simulado",
    precio: 12990,
    estado: "DISPONIBLE",
    categoryName: "organizacion",
    supplierName: "Invent Pro Demo",
  },
  {
    id: "sim-prod-2",
    nombre: "Kit de Limpieza",
    stock: 8,
    descripcion: "Producto simulado",
    precio: 6990,
    estado: "STOCK_BAJO",
    categoryName: "limpieza",
    supplierName: "Invent Pro Demo",
  },
  {
    id: "sim-prod-3",
    nombre: "Pack de Papeleria",
    stock: 25,
    descripcion: "Producto simulado",
    precio: 4990,
    estado: "DISPONIBLE",
    categoryName: "papeleria",
    supplierName: "Invent Pro Demo",
  },
];

const SIMULATED_SYSTEM_USERS: SystemUserRow[] = [
  { id: "user-1", name: "Abubakar Goje", role: "Admin", area: "Recursos Humanos" },
  { id: "user-2", name: "Ifeanyi Obinna", role: "Bodeguero", area: "Bodega" },
  { id: "user-3", name: "Bankole Olanrewaju", role: "Cliente", area: "Ventas" },
  { id: "user-4", name: "Chidinma Ebere", role: "Proveedor", area: "Compras" },
];

const SIMULATED_SUPPLIER_ORDERS: SupplierOrderRow[] = [
  { id: "sup-1", supplier: "PedroSanchez Ltda.", date: "08/09/2025", status: "pending" },
  { id: "sup-2", supplier: "PatoFluz Ltda.", date: "01/09/2025", status: "completed" },
  { id: "sup-3", supplier: "Marcuis SpA", date: "29/08/2025", status: "completed" },
  { id: "sup-4", supplier: "RainLow SpA", date: "03/09/2025", status: "pending" },
];

const SIMULATED_CATEGORY_STOCK: CategoryStockRow[] = [
  { id: "cat-1", label: "Muebles", percent: 70, color: "bg-blue-500" },
  { id: "cat-2", label: "Decoracion", percent: 50, color: "bg-green-500" },
  { id: "cat-3", label: "Limpieza", percent: 25, color: "bg-yellow-500" },
];

const formatNumber = (num: number) => new Intl.NumberFormat("es-CL").format(num);

const getStatusClasses = (status: OrderStatus) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-emerald-500/25 dark:text-emerald-100";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-100";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-100";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-rose-500/25 dark:text-rose-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-slate-700/60 dark:text-slate-100";
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

const generateSimulatedOrders = (): ApiOrder[] =>
  SIMULATED_ORDER_BLUEPRINT.map((item) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - item.daysAgo);
    return {
      id: item.id,
      client: { name: item.clientName },
      createdAt: date.toISOString(),
      status: item.status,
    };
  });

const mapRecentOrders = (orders: ApiOrder[]): RecentOrder[] =>
  orders
    .filter((order): order is ApiOrder & { id: string } => Boolean(order?.id))
    .slice(0, 5)
    .map((order) => {
      const clientName = order.client?.name?.trim();
      const customerName = order.customer?.name?.trim();
      const fallbackName = order.clientId
        ? "Cliente " + order.clientId.slice(0, 6).toUpperCase()
        : "Cliente sin identificar";
      return {
        id: order.id!,
        clientName: clientName || customerName || fallbackName,
        orderDate: order.createdAt ?? new Date().toISOString(),
        status: order.status ?? "pending",
      };
    });

const computeKpis = (products: ProductItem[] | null, orders: ApiOrder[] | null, fallback: KpiData): KpiData => {
  const computed: KpiData = { ...fallback };

  if (products) {
    computed.totalProducts = products.length;
    computed.lowStockItems = products.filter((product) => Number(product.stock) < LOW_STOCK_THRESHOLD).length;
  }

  if (orders) {
    const existingOrders = orders.filter((order): order is ApiOrder & { createdAt: string } => Boolean(order.createdAt));
    const totalOrders = existingOrders.length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const dailySales = existingOrders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= startOfToday;
    }).length;

    computed.dailySalesCount = dailySales;
    computed.totalSalesCount = totalOrders;
  }

  return computed;
};

const DashboardPage = () => {
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [systemUsers] = useState<SystemUserRow[]>(SIMULATED_SYSTEM_USERS);
  const [inventoryProducts, setInventoryProducts] = useState<ProductItem[]>(SIMULATED_PRODUCTS);
  const [supplierOrders] = useState<SupplierOrderRow[]>(SIMULATED_SUPPLIER_ORDERS);
  const [categoryStock] = useState<CategoryStockRow[]>(SIMULATED_CATEGORY_STOCK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(authUser ?? MOCK_USER);
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

    setError(null);

    const simulatedOrders = generateSimulatedOrders();
    setCurrentUser(authUser ?? MOCK_USER);
    setRecentOrders(mapRecentOrders(simulatedOrders));
    setKpis(computeKpis(SIMULATED_PRODUCTS, simulatedOrders, MOCK_KPIS));
    setNotice("Mostrando datos simulados mientras se conecta al servidor...");
    setLoading(false);

    try {
      const profilePromise: Promise<User> = authUser
        ? Promise.resolve(authUser)
        : api.get<User>(API_ENDPOINTS.userProfile).then((res) => res.data);

      const [profileRes, ordersRes, productsRes] = await Promise.allSettled([
        profilePromise,
        api.get<ApiOrder[]>(API_ENDPOINTS.orders),
        productsApi.list(),
      ]);

      if (!isMountedRef.current) return;

      const fallbacks: string[] = [];

      let user = authUser ?? MOCK_USER;
      if (profileRes.status === "fulfilled" && profileRes.value) {
        user = profileRes.value;
      } else if (!authUser) {
        fallbacks.push("usuario");
      }
      setCurrentUser(user);


      let products: ProductItem[] = SIMULATED_PRODUCTS;
      let usingSimulatedProducts = true;
      if (productsRes.status === "fulfilled") {
        products = productsRes.value.items;
        usingSimulatedProducts = false;
      }

      if (usingSimulatedProducts) {
        fallbacks.push("metricas");
      }

      let orders: ApiOrder[] = simulatedOrders;
      if (ordersRes.status === "fulfilled") {
        const data = ordersRes.value?.data;
        if (Array.isArray(data) && data.length > 0) {
          orders = data;
        } else {
          fallbacks.push("pedidos recientes");
        }
      } else {
        fallbacks.push("pedidos recientes");
      }

      setKpis(computeKpis(products, orders, MOCK_KPIS));
      setRecentOrders(mapRecentOrders(orders));
      setInventoryProducts(products);

      if (fallbacks.length > 0) {
        setNotice("Mostrando datos simulados para: " + [...new Set(fallbacks)].join(", ") + ".");
      } else {
        setNotice(null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("[dashboard] error general:", err);
      setError("No se pudieron cargar los datos del dashboard. Verifique la conexión al backend o su sesión.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = useCallback(async () => {
    if (!isMountedRef.current || isLoggingOut) return;

    const confirmed = await confirmAction({
      title: "Cerrar sesión",
      text: "¿Estás seguro de que deseas cerrar tu sesión?",
      confirmButtonText: "Sí, cerrar sesión",
    });

    if (!confirmed) return;

    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      if (!isMountedRef.current) return;

      await showSuccess({
        title: "Sesión cerrada",
        text: "Has cerrado sesión correctamente.",
        confirmButtonText: "Ir a iniciar sesión",
      });

      if (!isMountedRef.current) return;
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : "No se pudo cerrar la sesión. Intenta nuevamente.";
      if (isMountedRef.current) {
        setLogoutError(message);
      }
      await showError({
        title: "Error al cerrar sesión",
        text: message,
      });
    } finally {
      if (isMountedRef.current) setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, navigate]);

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
  const metricCards = [
    {
      id: "products",
      label: "Total de productos",
      detail: "Registros disponibles en el inventario.",
      value: kpis ? formatNumber(kpis.totalProducts) : "N/A",
      iconWrapper: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
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
      value: kpis ? formatNumber(kpis.lowStockItems) : "N/A",
      iconWrapper: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v-1.5a2.25 2.25 0 0 0-2.25-2.25h-3a2.25 2.25 0 0 0-2.25 2.25v.75m0 .75H7.5A2.25 2.25 0 0 0 5.25 9v5.25M8.25 6.75h7.5m0 0h.75A2.25 2.25 0 0 1 18.75 9v2.25M15 12h.008v.008H15V12Zm-3 0h.008v.008H12V12Zm-3 0h.008v.008H9V12Zm-3.75 2.25H3A1.5 1.5 0 0 0 1.5 15v2.25A1.5 1.5 0 0 0 3 18.75h.75M20.25 12h.75A2.25 2.25 0 0 1 23.25 14.25v3A2.25 2.25 0 0 1 21 19.5h-.75" />
        </svg>
      ),
    },
    {
      id: "daily-sales",
      label: "Ventas del día",
      detail: "Transacciones registradas en la jornada.",
      value: kpis ? formatNumber(kpis.dailySalesCount) : "N/A",
      iconWrapper: "bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 13.5v3.75a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V13.5m16.5 0L12 6.75 3.75 13.5m16.5 0H3.75m6.75 3H13.5" />
        </svg>
      ),
    },
    {
      id: "total-sales",
      label: "Ventas totales",
      detail: "Pedidos despachados históricamente.",
      value: kpis ? formatNumber(kpis.totalSalesCount) : "N/A",
      iconWrapper: "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100",
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.75A2.25 2.25 0 0 1 10.5 4.5h3a2.25 2.25 0 0 1 2.25 2.25v.75m2.25 12h-12A2.25 2.25 0 0 1 3.75 18V9.75A2.25 2.25 0 0 1 6 7.5h12a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25Zm-6-3a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
        </svg>
      ),
    },
  ];
  const lowStockProducts = inventoryProducts.filter((product) => Number(product.stock) < LOW_STOCK_THRESHOLD);
  const cardClass = "rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900";
  const compactCardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900";
  const listItemClass =
    "flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60";

  return (
    <div className="space-y-6">
      <section className={`${cardClass} md:p-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500 dark:text-blue-300">Panel principal</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">Hola, {currentUser.name}</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Rol actual: <span className="font-semibold text-blue-600 dark:text-blue-300">{currentUser.role}</span>. Gestiona tu inventario y pedidos desde aquí.
            </p>
            {notice ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
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
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
              {logoutError ? <p className="text-center text-xs text-red-600">{logoutError}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
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
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${metric.iconWrapper}`}>{metric.icon}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Órdenes recientes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">Últimos movimientos registrados en el sistema.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-300 transition hover:text-blue-700"
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
                    <tr key={order.id} className="text-sm text-slate-700">
                      <td className="py-3 font-medium">{order.clientName}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-300">{new Date(order.orderDate).toLocaleDateString('es-CL')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40 p-6 text-center text-sm text-slate-500 dark:text-slate-300">
              Aún no registras órdenes recientes.
            </p>
          )}
        </section>

        <div className="space-y-6">
          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Usuarios del sistema</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-300">Resumen</span>
            </div>
            <ul className="mt-4 space-y-3">
              {systemUsers.map((user) => (
                <li
                  key={user.id}
                  className={listItemClass}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {user.role} - {user.area}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Activo</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Órdenes a proveedores</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-300">Período actual</span>
            </div>
            <ul className="mt-4 space-y-3">
              {supplierOrders.map((order) => (
                <li
                  key={order.id}
                  className={listItemClass}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.supplier}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{order.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Distribución de stock</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-300">Actualizado</span>
          </div>
          <div className="mt-5 space-y-5">
            {categoryStock.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span>{category.label}</span>
                  <span>{category.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`${category.color} h-2 rounded-full`} style={{ width: `${category.percent}%` }} />
                </div>
              </div>
            ))}
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
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">Revisar</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/40 p-6 text-center text-sm text-slate-500 dark:text-slate-300">
              No hay productos por debajo del umbral definido.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;




