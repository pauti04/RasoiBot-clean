import React, { useEffect, useState } from "react";
import { subscribe, dismissToast } from "../lib/toast.js";

const ICONS = { success: "✓", error: "!", info: "i" };

export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => subscribe(setItems), []);

  if (!items.length) return null;
  return (
    <div className="toaster" role="status" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <span className="toast__icon" aria-hidden="true">{ICONS[t.kind] || "·"}</span>
          <span className="toast__msg">{t.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
