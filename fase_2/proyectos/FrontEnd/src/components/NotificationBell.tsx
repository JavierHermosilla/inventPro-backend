import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSettingsStore, type NotificationItem } from "../store/settings";

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const severityBadge: Record<NotificationItem["severity"], string> = {
  critical: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-600",
};

const emptyIcon = (
  <svg className="mx-auto h-14 w-14 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V5a2 2 0 0 0-4 0v.3A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1" />
  </svg>
);

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useSettingsStore((state) => state.notifications.unreadCount);
  const items = useSettingsStore((state) => state.notifications.items);
  const markAsRead = useSettingsStore((state) => state.markNotificationAsRead);
  const markAllAsRead = useSettingsStore((state) => state.markAllNotificationsAsRead);
  const clearNotifications = useSettingsStore((state) => state.clearNotifications);

  const latestItems = useMemo(() => items.slice(0, 8), [items]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V5a2 2 0 1 0-4 0v.3A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-3 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Centro de alertas</p>
              <p className="text-xs text-gray-500">{unreadCount} pendientes</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Marcar todo
              </button>
              <button
                type="button"
                onClick={() => {
                  clearNotifications();
                  setOpen(false);
                }}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Limpiar
              </button>
            </div>
          </header>

          {latestItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              {emptyIcon}
              <p className="text-sm font-medium text-gray-700">Sin notificaciones</p>
              <p className="text-xs text-gray-500">Las alertas nuevas apareceran aqui en cuanto ocurran.</p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {latestItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                      item.read ? "bg-white hover:bg-gray-50" : "bg-blue-50/60 hover:bg-blue-50"
                    }`}
                  >
                    <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${item.read ? "bg-gray-300" : "bg-blue-500"}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                        <span className="text-[11px] text-gray-400">{formatTimestamp(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{item.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityBadge[item.severity]}`}>
                          {item.type === "low-stock" ? "Stock" : item.type}
                        </span>
                        {!item.read ? <span className="text-[11px] font-medium text-blue-600">Nuevo</span> : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-right text-xs">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Ir a configuracion
            </Link>
          </footer>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
