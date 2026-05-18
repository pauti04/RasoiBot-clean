import { useEffect, useRef, useState } from "react";

// Debounce a value — useful for live search.
export function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

// Bind a global keydown handler. shortcut is { key, ctrl?, meta?, alt?, shift? }.
// Skips when typing in an input/textarea/contenteditable unless allowInInput.
export function useKeyboard(shortcut, handler, { allowInInput = false } = {}) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    function onKey(e) {
      if (!allowInInput) {
        const t = e.target;
        const tag = (t.tagName || "").toLowerCase();
        if (t.isContentEditable || tag === "input" || tag === "textarea" || tag === "select") return;
      }
      if (shortcut.key && e.key !== shortcut.key) return;
      if (shortcut.ctrl  && !e.ctrlKey)  return;
      if (shortcut.meta  && !e.metaKey)  return;
      if (shortcut.alt   && !e.altKey)   return;
      if (shortcut.shift && !e.shiftKey) return;
      ref.current(e);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut.key, shortcut.ctrl, shortcut.meta, shortcut.alt, shortcut.shift, allowInInput]);
}

// URL hash → state and back. Reads `#view=discover&q=dal&region=...`.
export function useHashState() {
  const [state, setState] = useState(parseHash);

  useEffect(() => {
    function onHashChange() { setState(parseHash()); }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function set(patch) {
    const next = { ...parseHash(), ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === null || v === "") continue;
      params.set(k, v);
    }
    const s = params.toString();
    const newHash = s ? `#${s}` : "";
    if (newHash !== window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search + newHash);
    }
    setState(next);
  }

  return [state, set];
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(raw);
  const out = {};
  for (const [k, v] of params) out[k] = v;
  return out;
}
