import { useEffect } from "react";
import { productsApi } from "../lib/productsApi";
import {
  useSettingsStore,
  type NotificationPreferences,
} from "../store/settings";

const hasBrowserNotifications = typeof window !== "undefined" && "Notification" in window;

const isWithinQuietHours = (prefs: NotificationPreferences) => {
  if (!prefs.quietHours.enabled) return false;
  const parse = (value: string) => {
    const [hours, mins] = value.split(":").map((part) => Number(part));
    const h = Number.isFinite(hours) ? hours : 0;
    const m = Number.isFinite(mins) ? mins : 0;
    return h * 60 + m;
  };
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const start = parse(prefs.quietHours.start);
  const end = parse(prefs.quietHours.end);

  if (start === end) return true;
  if (start < end) {
    return minutesNow >= start && minutesNow < end;
  }
  return minutesNow >= start || minutesNow < end;
};

const notifyBrowser = (title: string, body: string) => {
  if (!hasBrowserNotifications) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/vite.svg",
      tag: `inventpro-stock-${Date.now()}`,
    });
  } catch {
    // ignored
  }
};

const InventoryWatcher = () => {
  const lowStockEnabled = useSettingsStore((state) => state.notifications.preferences.lowStockEnabled);
  const threshold = useSettingsStore((state) => state.notifications.preferences.lowStockThreshold);
  const repeatMinutes = useSettingsStore((state) => state.notifications.preferences.repeatMinutes);
  const checkEveryMinutes = useSettingsStore((state) => state.notifications.preferences.checkEveryMinutes);
  const pushEnabled = useSettingsStore((state) => state.notifications.preferences.pushEnabled);
  const soundEnabled = useSettingsStore((state) => state.notifications.preferences.soundEnabled);
  const emailDigestEnabled = useSettingsStore((state) => state.notifications.preferences.emailDigestEnabled);
  const quietHours = useSettingsStore((state) => state.notifications.preferences.quietHours);

  const addNotification = useSettingsStore((state) => state.addNotification);
  const registerLowStockAlert = useSettingsStore((state) => state.registerLowStockAlert);
  const releaseLowStockAlert = useSettingsStore((state) => state.releaseLowStockAlert);

  useEffect(() => {
    if (!lowStockEnabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;

    const playBeep = async () => {
      if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        osc.onended = () => ctx.close().catch(() => {});
      } catch {
        // ignore sound errors
      }
    };

    const scheduleNext = () => {
      if (cancelled) return;
      const delay = Math.max(checkEveryMinutes, 1) * 60_000;
      timer = setTimeout(runCheck, delay);
    };

    const runCheck = async () => {
      if (cancelled || running) return;
      running = true;
      try {
        const { items } = await productsApi.list({ limit: 200 });
        const quiet = isWithinQuietHours({
          lowStockEnabled,
          lowStockThreshold: threshold,
          repeatMinutes,
          checkEveryMinutes,
          pushEnabled,
          soundEnabled,
          emailDigestEnabled,
          quietHours,
        });
        for (const product of items) {
          const productId = product.id;
          if (product.stock <= threshold) {
            const shouldNotify = registerLowStockAlert(productId, repeatMinutes);
            if (shouldNotify) {
              const severity = product.stock <= 0 ? "critical" : "warning";
              const created = addNotification({
                title: product.stock <= 0 ? `Producto sin stock: ${product.nombre}` : `Stock bajo: ${product.nombre}`,
                message: `Stock actual ${product.stock} unidades. Umbral configurado ${threshold}.`,
                type: "low-stock",
                severity,
                meta: { productId },
              });
              if (pushEnabled && !quiet) {
                notifyBrowser(created.title, created.message);
              }
              if (soundEnabled && !quiet) {
                void playBeep();
              }
            }
          } else {
            releaseLowStockAlert(productId);
          }
        }
      } catch (err) {
        console.error("[inventory-watcher] fallo al consultar stock", err);
      } finally {
        running = false;
        scheduleNext();
      }
    };

    runCheck();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    lowStockEnabled,
    threshold,
    repeatMinutes,
    checkEveryMinutes,
    pushEnabled,
    soundEnabled,
    emailDigestEnabled,
    quietHours,
    registerLowStockAlert,
    releaseLowStockAlert,
    addNotification,
  ]);

  return null;
};

export default InventoryWatcher;
