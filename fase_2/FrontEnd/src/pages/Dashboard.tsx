import React from 'react';

const DashboardPage = () => {
  return (
    <>
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen General</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cards */}
          <div className="bg-blue-100 p-4 rounded-lg shadow-md flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-800">Productos Totales</h3>
            <span className="text-2xl font-bold text-blue-800">5,000</span>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow-md flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-800">Stock Bajo</h3>
            <span className="text-2xl font-bold text-green-800">150</span>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg shadow-md flex items-center justify-between">
            <h3 className="text-lg font-semibold text-purple-800">Ventas del Día</h3>
            <span className="text-2xl font-bold text-purple-800">230</span>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow-md flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-800">Ventas Totales</h3>
            <span className="text-2xl font-bold text-red-800">12,000</span>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Pedidos Recientes</h2>
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Empresa A</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">22/09/2025</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Entregado</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bazar B</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">21/09/2025</td>
                <td className="px-6 py-4 whitespace-now-2 sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Recibido</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

export default DashboardPage;