import { For, Show, onCleanup } from "solid-js";
import { alerts } from "@/lib/alerts";

// Site-wide toasts. Mount once in App. Also funnels unhandled promise
// rejections (e.g. a realtime resubscribe failing) into error alerts so
// background failures are visible instead of silent.
export default function Alerts() {
  const onRejection = (e: PromiseRejectionEvent) => {
    const reason = e.reason as { message?: string; data?: { data?: Record<string, { message?: string }> } } | null;
    alerts.error(reason?.message ?? String(e.reason));
    const fields = reason?.data?.data ?? {};
    for (const key of Object.keys(fields)) {
      const message = fields[key]?.message;
      if (message) alerts.error(`${key}: ${message}`);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", onRejection);
    onCleanup(() => window.removeEventListener("unhandledrejection", onRejection));
  }
  return (
    <Show when={alerts.list().length > 0}>
      <div class="vstack gap-2">
        <Show when={alerts.list().length > 1}>
          <button type="button" class="ghost small" onClick={() => alerts.dismissAll()}>
            dismiss all
          </button>
        </Show>
        <For each={alerts.list()}>
          {(alert) => (
            <div role="alert" data-variant={alert.type === "error" ? "danger" : alert.type}>
              {alert.message}
              <button
                type="button"
                class="ghost icon small"
                aria-label="dismiss"
                onClick={() => alerts.dismiss(alert)}
              >
                ×
              </button>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}
