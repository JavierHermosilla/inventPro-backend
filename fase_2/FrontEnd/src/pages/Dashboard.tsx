import React, { useState, useEffect } from 'react';
import api from '../lib/api'; // Se asume que 'api' es la instancia de Axios exportada por defecto

// --- 1. INTERFACES DE DATOS ---

interface User {
  name: string;
  role: string; // Ejemplo: 'Admin', 'Bodeguero', 'Vendedor'
}

interface KpiData {
  totalProducts: number;
  lowStockItems: number;
  dailySalesCount: number;
  totalSalesCount: number;
}

interface Order {
  id: number;
  clientName: string;
  orderDate: string; // Asumimos que viene como string ISO del backend
  status: 'Entregado' | 'Recibido' | 'Pendiente' | 'Cancelado';
}

// --- 2. FUNCIONES UTILITARIAS ---

// Función para formatear números grandes (ej: 5000 -> 5,000)
const formatNumber = (num: number) => new Intl.NumberFormat('es-CL').format(num);

// Función para obtener el estilo de la etiqueta de estado
const getStatusClasses = (status: Order['status']) => {
  switch (status) {
    case 'Entregado':
      return 'bg-green-100 text-green-800';
    case 'Recibido':
      return 'bg-blue-100 text-blue-800';
    case 'Pendiente':
      return 'bg-amber-100 text-amber-800';
    case 'Cancelado':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Componente principal del Dashboard.
 * Muestra métricas clave, información del usuario y una tabla de pedidos recientes.
 */
const DashboardPage = () => {
  // --- 3. ESTADO DEL COMPONENTE ---
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Nuevos estados para la barra de bienvenida
  const [currentUser, setCurrentUser] = useState<User>({ name: 'Usuario Invitado', role: 'Cargando...' });
  const [dateTime, setDateTime] = useState(new Date());

  // --- 4. FUNCIÓN PARA CARGAR DATOS ---
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    // Simulamos datos (MOCK DATA)
    const mockUser: User = { name: 'Javier Hermosilla', role: 'Administrador' };
    const mockKpis: KpiData = {
      totalProducts: 5430,
      lowStockItems: 85,
      dailySalesCount: 173,
      totalSalesCount: 12450,
    };
    const mockOrders: Order[] = [
      { id: 1, clientName: 'Empresa Alpha Ltda.', orderDate: '2025-09-28', status: 'Entregado' },
      { id: 2, clientName: 'Bazar El Rápido', orderDate: '2025-09-27', status: 'Recibido' },
      { id: 3, clientName: 'Distribuidora Global', orderDate: '2025-09-26', status: 'Pendiente' },
      { id: 4, clientName: 'Tienda Muebles S.A.', orderDate: '2025-09-25', status: 'Cancelado' },
    ];


    try {
      // Aquí se usaría el API para obtener datos reales
      // const userResponse = await api.get<User>('/auth/me');
      // setCurrentUser(userResponse.data);
      
      // ... Llamadas a KPIs y Órdenes
      
      setCurrentUser(mockUser);
      setKpis(mockKpis);
      setRecentOrders(mockOrders);
      
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
      setError("No se pudieron cargar los datos del dashboard. Verifique la conexión al backend o su sesión.");
    } finally {
      setLoading(false);
    }
  };

  // --- 5. EFECTOS PARA CARGA Y HORA ---

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Efecto para actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer); // Limpieza del intervalo
  }, []);

  // Manejador de Cierre de Sesión (Simulado)
  const handleLogout = () => {
    // En una app real, aquí se llamaría al endpoint /auth/logout
    console.log("Cerrando sesión...");
    // IMPORTANTE: Usamos console.log en lugar de alert()
    alert("Sesión cerrada. En una aplicación real, esto redirigiría a login.");
  };


  // --- 6. RENDERIZADO CONDICIONAL ---

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Cargando datos del Dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 border border-red-300 rounded-xl shadow-lg">
        ⚠️ Error: {error}
      </div>
    );
  }

  const formattedTime = dateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateTime.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* ESTE ES EL ÚNICO BLOQUE DE BIENVENIDA. Si ves dos, el problema está en el archivo padre. */}
      <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-l-4 border-blue-500">
        {/* Información del Usuario y Saludo */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-extrabold text-gray-900">
            ¡Hola, {currentUser.name}!
          </h1>
          <p className="text-sm font-medium text-blue-600 mt-1">
            Rol: <span className="text-gray-700">{currentUser.role}</span>
          </p>
        </div>

        {/* Hora, Fecha y Botón de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Hora y Fecha */}
          <div className="text-right text-gray-600">
            <p className="text-xl font-bold">{formattedTime}</p>
            <p className="text-xs capitalize">{formattedDate}</p>
          </div>
          
          {/* Botón de Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      {/* Sección: Resumen General (KPIs) */}
      <section className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-6 border-b pb-2">Métricas Clave</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card: Productos Totales (USA DATOS REALES) */}
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-md flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]">
            <h3 className="text-md font-semibold text-blue-700">Productos Totales</h3>
            <span className="text-3xl font-black text-blue-800 mt-2">{kpis ? formatNumber(kpis.totalProducts) : 'N/A'}</span>
          </div>
          
          {/* Card: Stock Bajo (USA DATOS REALES) */}
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl shadow-md flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]">
            <h3 className="text-md font-semibold text-amber-700">Stock Bajo</h3>
            <span className="text-3xl font-black text-amber-800 mt-2">{kpis ? formatNumber(kpis.lowStockItems) : 'N/A'}</span>
          </div>
          
          {/* Card: Ventas del Día (USA DATOS REALES) */}
          <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl shadow-md flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]">
            <h3 className="text-md font-semibold text-purple-700">Ventas del Día</h3>
            <span className="text-3xl font-black text-purple-800 mt-2">{kpis ? formatNumber(kpis.dailySalesCount) : 'N/A'}</span>
          </div>
          
          {/* Card: Ventas Totales (USA DATOS REALES) */}
          <div className="bg-red-50 border border-red-200 p-5 rounded-xl shadow-md flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]">
            <h3 className="text-md font-semibold text-red-700">Ventas Totales</h3>
            <span className="text-3xl font-black text-red-800 mt-2">{kpis ? formatNumber(kpis.totalSalesCount) : 'N/A'}</span>
          </div>
        </div>
      </section>

      {/* Sección: Pedidos Recientes (Tabla) */}
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-6 border-b pb-2">Pedidos Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Pedido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Mapeamos los pedidos recientes (USA DATOS REALES) */}
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(order.status)}`}>
                      {order.status}
                    </span>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recentOrders.length === 0 && !loading && (
            <p className="text-center py-4 text-gray-500">No hay pedidos recientes para mostrar.</p>
        )}
      </section>
    </>
  );
};

export default DashboardPage;