const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5175";

async function request(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : {};
  if (!resp.ok) {
    const err = new Error(data?.error || `HTTP ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  query: (body) => request("/api/query", { method: "POST", body: JSON.stringify(body) }),

  pantry: {
    list: () => request("/api/pantry"),
    add: (item) => request("/api/pantry", { method: "POST", body: JSON.stringify(item) }),
    update: (id, patch) => request(`/api/pantry/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id) => request(`/api/pantry/${id}`, { method: "DELETE" }),
  },

  shopping: {
    list: () => request("/api/shopping"),
    add: (item) => request("/api/shopping", { method: "POST", body: JSON.stringify(item) }),
    update: (id, patch) => request(`/api/shopping/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id) => request(`/api/shopping/${id}`, { method: "DELETE" }),
    clearChecked: () => request("/api/shopping/clear-checked", { method: "POST" }),
    fromRecipe: (recipeId) => request("/api/shopping/from-recipe", {
      method: "POST",
      body: JSON.stringify({ recipeId }),
    }),
  },

  recipes: {
    cookable: (minCoverage = 0.7) =>
      request(`/api/recipes/cookable?minCoverage=${minCoverage}`),
  },
};
