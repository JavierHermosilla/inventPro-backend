import { useState, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: Array<"admin" | "vendedor" | "bodeguero" | "user">;
};

const iconClassName = "h-5 w-5";

const HomeIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M10 2 2 9h2v9h5v-5h2v5h5V9h2L10 2z" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z" />
  </svg>
);

const BuildingIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M4 3h12v14H4z" />
    <path d="M7 6h2v2H7zM11 6h2v2h-2zM7 10h2v2H7zM11 10h2v2h-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M4 17v-1a4 4 0 014-4h4a4 4 0 014 4v1z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M6 3h8a2 2 0 012 2v12H4V5a2 2 0 012-2z" />
    <path d="M7 2h6v2H7z" />
  </svg>
);

const ReportIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M4 3h12v14H4z" />
    <path d="M7 12h2v3H7zM11 9h2v6h-2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={iconClassName} aria-hidden="true">
    <path d="M11.5 2l1 2.5 2.5 1-1.5 2 1.5 2-2.5 1-1 2.5-2-1-2 1-1-2.5-2.5-1 1.5-2-1.5-2 2.5-1 1-2.5 2 1z" />
    <circle cx="10" cy="10" r="2.5" fill="white" />
  </svg>
);

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <HomeIcon /> },
  { to: "/products", label: "Gestion de productos", icon: <GridIcon /> },
  { to: "/suppliers", label: "Gestion de proveedores", icon: <BuildingIcon /> },
  { to: "/clients", label: "Gestion de clientes", icon: <UsersIcon /> },
  { to: "/users", label: "Gestion de usuarios", roles: ["admin"], icon: <UsersIcon /> },
  { to: "/categories", label: "Gestion de categorias", icon: <GridIcon /> },
  { to: "/orders", label: "Ordenes de compra", icon: <ClipboardIcon /> },
  { to: "/manual-inventory", label: "Inventario manual", icon: <ClipboardIcon /> },
  { to: "/reports", label: "Reportes", icon: <ReportIcon /> },
  { to: "/settings", label: "Configuracion", icon: <SettingsIcon /> },
];

const Layout = () => {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const role = (user?.role ?? "user") as "admin" | "vendedor" | "bodeguero" | "user";

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
            onClick={() => document.dispatchEvent(new CustomEvent("logout:click"))}
            className="w-full px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition"
          >
            <span className="inline-flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesion
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
