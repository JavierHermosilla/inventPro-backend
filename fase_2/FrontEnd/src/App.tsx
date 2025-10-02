import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";

// Páginas
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import ProductsPage from "./pages/Products";
import SuppliersPage from "./pages/Suppliers";
import ClientsPage from "./pages/Clients";
import CategoriesPage from "./pages/Categories";
import OrdersPage from "./pages/Orders";
import ManualInventoryPage from "./pages/ManualInventory";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";

// Layout + Protected
import Layout from "./components/Layout";
import Protected from "./routes/Protected";

const App = () => {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const hydrated = useAuthStore((s) => s.hydrated);

  // Evita múltiples llamadas a fetchMe por StrictMode o remounts
  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      if (!hydrated) {
        fetchMe().catch(() => {});
      }
    }

    // Listener opcional del boton "Cerrar sesion" (emitido desde Layout)
    const handler = async () => {
      try {
        await logout();
        window.location.href = "/login";
      } catch {
        // no-op
      }
    };
    document.addEventListener("logout:click", handler);
    return () => document.removeEventListener("logout:click", handler);
  }, [fetchMe, logout, hydrated]);

  if (!hydrated || loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protegidas con Layout */}
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/manual-inventory" element={<ManualInventoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Solo admin */}
          <Route
            path="/users"
            element={
              <Protected allowedRoles={["admin"]}>
                <UsersPage />
              </Protected>
            }
          />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;



