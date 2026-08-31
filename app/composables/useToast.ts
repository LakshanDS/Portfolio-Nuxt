// Global
// module-level state so any component can push toasts without prop drilling.
// Mount <UiToasts/> once (the jasladmin-dashboard layout does) to render them.
export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

const toasts = ref<ToastItem[]>([]);
let seq = 0;

function push(message: string, type: ToastType, duration: number) {
  const id = `${Date.now()}-${seq++}`;
  toasts.value = [...toasts.value, { id, message, type, duration }];
}

export function useToast() {
  return {
    toasts,
    success: (message: string, duration = 5000) => push(message, "success", duration),
    error: (message: string, duration = 5000) => push(message, "error", duration),
    info: (message: string, duration = 5000) => push(message, "info", duration),
    remove: (id: string) => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id);
    },
  };
}
