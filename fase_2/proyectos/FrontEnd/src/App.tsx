import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { useSettingsStore } from "./store/settings";
import { applyDocumentTheme } from "./lib/theme";

// Páginas
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import ProductsPage from "./pages/Products";
import SuppliersPage from "./pages/Suppliers";
import ClientsPage from "./pages/Clients";
import CreateClientPage from "./pages/CreateClient";
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
  const hydrated = useAuthStore((s) => s.hydrated);
  const theme = useSettingsStore((s) => s.appearance.theme);

  // Evita múltiples llamadas a fetchMe por StrictMode o remounts
  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      if (!hydrated) {
        fetchMe().catch(() => {});
      }
    }
  }, [fetchMe, hydrated]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[theme] App effect", theme);
    }
    applyDocumentTheme(theme);
  }, [theme]);

  if (!hydrated || loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protegidas con Layout */}
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Protected allowedRoles={["admin", "bodeguero", "vendedor"]}>
                <DashboardPage />
              </Protected>
            }
          />
          <Route path="/products" element={<ProductsPage />} />
          <Route
            path="/suppliers"
            element={
              <Protected allowedRoles={["admin", "bodeguero"]}>
                <SuppliersPage />
              </Protected>
            }
          />
          <Route
            path="/clients"
            element={
              <Protected allowedRoles={["admin", "bodeguero", "vendedor"]}>
                <ClientsPage />
              </Protected>
            }
          />
          <Route
            path="/clients/create"
            element={
              <Protected allowedRoles={["admin", "vendedor"]}>
                <CreateClientPage />
              </Protected>
            }
          />
          <Route
            path="/clients/:clientId/edit"
            element={
              <Protected allowedRoles={["admin"]}>
                <CreateClientPage />
              </Protected>
            }
          />
          <Route
            path="/categories"
            element={
              <Protected allowedRoles={["admin"]}>
                <CategoriesPage />
              </Protected>
            }
          />
          <Route path="/orders" element={<OrdersPage />} />
          <Route
            path="/manual-inventory"
            element={
              <Protected allowedRoles={["admin", "bodeguero"]}>
                <ManualInventoryPage />
              </Protected>
            }
          />
          <Route
            path="/reports"
            element={
              <Protected allowedRoles={["admin"]}>
                <ReportsPage />
              </Protected>
            }
          />

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
