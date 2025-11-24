import type { Key, ReactNode } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
};

function resolveCellValue<T>(row: T, column: Column<T>): ReactNode {
  if (column.render) {
    return column.render(row);
  }

  const key = column.key as keyof T;
  return (row as Record<keyof T, ReactNode>)[key];
}

function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = "Sin datos para mostrar",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white rounded-xl shadow">
        Cargando...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={(row.id ?? index) as Key} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-4 py-3 text-sm text-gray-700 ${column.className ?? ""}`}
                  >
                    {resolveCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;

