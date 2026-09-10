import { createSignal } from "solid-js";

export type AlertType = "info" | "success" | "warning" | "error";
export type Alert = { id: number; message: string; type: AlertType };

const [list, setList] = createSignal<Alert[]>([]);
let nextId = 1;

function dismiss(alert: Alert) {
  setList((alerts) => alerts.filter((a) => a.id !== alert.id));
}

function add(message: string, type: AlertType = "info", timeout = 0) {
  const alert = { id: nextId++, message, type };
  setList((alerts) => [...alerts, alert]);
  if (timeout) setTimeout(() => dismiss(alert), timeout);
}

export const alerts = {
  list,
  add,
  info: (message: string, timeout = 0) => add(message, "info", timeout),
  success: (message: string, timeout = 0) => add(message, "success", timeout),
  warning: (message: string, timeout = 0) => add(message, "warning", timeout),
  error: (message: string, timeout = 0) => add(message, "error", timeout),
  dismiss,
  dismissAll: () => setList([]),
};

// Run a PocketBase request, surfacing failures as error alerts instead of
// throwing: top-level message plus one alert per invalid field.
export async function alertOnFailure(request: () => void | Promise<unknown>): Promise<void> {
  try {
    await request();
  } catch (e: unknown) {
    const err = e as { message?: string; data?: { data?: Record<string, { message?: string }> } };
    if (err?.message) alerts.error(err.message);
    const fields = err?.data?.data ?? {};
    for (const key of Object.keys(fields)) {
      const message = fields[key]?.message;
      if (message) alerts.error(`${key}: ${message}`);
    }
  }
}
