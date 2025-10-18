import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { confirmAction, showError, showSuccess } from "../lib/alerts";
import { useAuthStore } from "../store/auth";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: Array<"admin" | "vendedor" | "bodeguero" | "user">;
};

const iconClassName = "h-5 w-5 flex-shrink-0";

const DashboardIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ProductsIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const SuppliersIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375A1.125 1.125 0 0 1 2.25 17.625V14.25m17.25 4.5a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

const ClientsIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const UsersIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
  </svg>
);

const CategoriesIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);

const OrdersIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
  </svg>
);

const InventoryIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
);

const ReportsIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className={iconClassName} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/products", label: "Gestión de Productos", icon: <ProductsIcon /> },
  { to: "/suppliers", label: "Gestión de Proveedores", icon: <SuppliersIcon /> },
  { to: "/clients", label: "Gestión de Clientes", icon: <ClientsIcon /> },
  { to: "/users", label: "Gestión de Usuarios", roles: ["admin"], icon: <UsersIcon /> },
  { to: "/categories", label: "Gestión de Categorías", icon: <CategoriesIcon /> },
  { to: "/orders", label: "Órdenes de Compra", icon: <OrdersIcon /> },
  { to: "/manual-inventory", label: "Inventario Manual", icon: <InventoryIcon /> },
  { to: "/reports", label: "Reportes", icon: <ReportsIcon /> },
  { to: "/settings", label: "Configuración", icon: <SettingsIcon /> },
];

const Layout = () => {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const role = (user?.role ?? "user") as "admin" | "vendedor" | "bodeguero" | "user";

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = await confirmAction({
      title: "Cerrar sesión",
      text: "¿Estás seguro de que deseas cerrar tu sesión?",
      confirmButtonText: "Sí, cerrar sesión",
    });

    if (!confirmed) return;

    setIsLoggingOut(true);
    setOpen(false);

    try {
      await logout();
      await showSuccess({
        title: "Sesión cerrada",
        text: "Has cerrado sesión correctamente.",
        confirmButtonText: "Ir a iniciar sesión",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : "No pudimos cerrar la sesión. Intenta nuevamente.";
      await showError({
        title: "Error al cerrar sesión",
        text: message,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative`}
      >
        <div className="p-6 border-b flex items-center gap-2">
          <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="text-2xl font-bold text-blue-600">Invent Pro</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isActive ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
                  }`
                }
                onClick={() => setOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              <LogoutIcon />
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-0">
        <header className="sticky top-0 z-30 bg-white border-b p-4 flex items-center justify-between">
          <button
            className="md:hidden px-3 py-2 rounded-lg border hover:bg-gray-50"
            onClick={() => setOpen((value) => !value)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 px-2">
            <p className="text-sm text-gray-600">
              Hola, <span className="text-blue-600 font-semibold">{user?.name ?? "Invitado"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative text-gray-600 hover:text-blue-600 transition-colors">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
              </svg>
              <span className="absolute -top-0 -right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-200 border" />
              <div className="leading-4">
                <p className="text-sm font-medium text-gray-800">{user?.name ?? "Invitado"}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role ?? "usuario"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;


