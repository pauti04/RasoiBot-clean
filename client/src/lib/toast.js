// Tiny global toast store. No deps — components subscribe via useToasts().

let _id = 0;
const listeners = new Set();
let toasts = [];

function emit() {
  for (const fn of listeners) fn(toasts);
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(toasts);
  return () => listeners.delete(fn);
}

export function pushToast({ kind = "info", message, duration = 3500 }) {
  const id = ++_id;
  toasts = [...toasts, { id, kind, message }];
  emit();
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message, opts) => pushToast({ kind: "success", message, ...opts }),
  error:   (message, opts) => pushToast({ kind: "error",   message, ...opts }),
  info:    (message, opts) => pushToast({ kind: "info",    message, ...opts }),
};
