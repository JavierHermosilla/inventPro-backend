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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center border-l-4 border-blue-500">
        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">Panel principal</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Hola {currentUser.name}, nos alegra verte de nuevo.</h1>
          <p className="text-sm text-gray-600 mt-2">
            Rol actual: <span className="font-semibold text-blue-600">{currentUser.role}</span>. Gestiona tu inventario y pedidos desde aqui.
          </p>
          {notice && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">{notice}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <div className="text-right text-gray-600 flex-1">
            <p className="text-xl font-bold">{formattedTime}</p>
            <p className="text-xs capitalize">{formattedDate}</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 min-w-[180px]">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
            </button>
            {logoutError && <p className="text-xs text-red-600 text-center">{logoutError}</p>}
          </div>
        </div>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-extrabold text-gray-800">Metricas clave</h2>
          <p className="text-sm text-gray-500">Monitorea los indicadores mas relevantes en tiempo real.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="text-md font-semibold text-blue-700">Productos totales</h3>
            <span className="text-3xl font-black text-blue-800 mt-2">{kpis ? formatNumber(kpis.totalProducts) : "N/A"}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="text-md font-semibold text-amber-700">Stock bajo</h3>
            <span className="text-3xl font-black text-amber-800 mt-2">{kpis ? formatNumber(kpis.lowStockItems) : "N/A"}</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="text-md font-semibold text-purple-700">Ventas del día</h3>
            <span className="text-3xl font-black text-purple-800 mt-2">{kpis ? formatNumber(kpis.dailySalesCount) : "N/A"}</span>
          </div>
          <div className="bg-red-50 border border-red-200 p-5 rounded-xl shadow-md flex flex-col justify-between">
            <h3 className="text-md font-semibold text-red-700">Ventas totales</h3>
            <span className="text-3xl font-black text-red-800 mt-2">{kpis ? formatNumber(kpis.totalSalesCount) : "N/A"}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2 items-start">
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-2xl font-extrabold text-gray-800">?rdenes recientes</h2>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Top 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="py-3">Cliente</th>
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="text-sm text-gray-700">
                    <td className="py-3 font-medium">{order.clientName}</td>
                    <td className="py-3 text-gray-500">{new Date(order.orderDate).toLocaleDateString("es-CL")}</td>
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
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800">Usuarios del sistema</h2>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Resumen</span>
            </div>
            <ul className="space-y-3">
              {systemUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role} · {user.area}</p>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold">Activo</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-extrabold text-gray-800">?rdenes a proveedores</h2>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Periodo actual</span>
            </div>
            <ul className="space-y-3">
              {supplierOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{order.supplier}</p>
                    <p className="text-xs text-gray-500">{order.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-4">Distribuci?n de stock</h2>
          <div className="space-y-4">
            {categoryStock.map((category) => (
              <div key={category.id}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{category.label}</span>
                  <span>{category.percent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className={`${category.color} h-2 rounded-full`} style={{ width: `${category.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-800">Productos con stock bajo</h2>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Umbral {LOW_STOCK_THRESHOLD}</span>
          </div>
          <div className="space-y-3">
            {inventoryProducts.filter((product) => Number(product.stock) < LOW_STOCK_THRESHOLD).map((product) => (
              <div key={product.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{product.nombre}</p>
                  <p className="text-xs text-gray-500">Stock actual: {product.stock}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Revisar</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;



