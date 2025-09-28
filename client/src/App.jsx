import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5175";

export default function App() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm RasoiBot 🍲. Ask me for Indian recipes!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query })
      });
      const data = await resp.json();

      let replyText;
      if (data.results?.length > 0) {
        const r = data.results[0];
        const ingredients = (r.ingredients || []).map(i => {
          const qty = i.quantity === undefined ? "" : `${i.quantity} `;
          const unit = i.unit ? `${i.unit} ` : "";
          return `- ${qty}${unit}${i.name}`;
        }).join("\n");

        const steps = (r.steps || []).map((s, idx) => `${idx+1}. ${s}`).join("\n\n");

        replyText = `*${r.name}* (${r.servings || "N/A"} servings)\n\nIngredients:\n${ingredients}\n\nSteps:\n${steps}`;
      } else if (data.source) {
        replyText = "Here's an AI-generated recipe (couldn't parse fully).";
      } else {
        replyText = "Sorry, I couldn't find or generate a recipe.";
      }

      setMessages(prev => [...prev, { role: "bot", text: replyText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      background: "#fffaf0", color: "#1f2937"
    }}>
      <header style={{
        padding: "1rem", borderBottom: "2px solid #7f1d1d",
        background: "#b91c1c", color: "#fff"
      }}>
        <h1 style={{ margin: 0 }}>RasoiBot 🍲</h1>
        <div style={{ fontSize: 13, color: "#ffe4e6" }}>Ask for Indian recipes — powered by AI</div>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            textAlign: m.role === "user" ? "right" : "left",
            margin: "0.5rem 0"
          }}>
            <div style={{
              display: "inline-block",
              padding: "0.6rem 0.9rem",
              borderRadius: 12,
              background: m.role === "user" ? "#fef3c7" : "#ecfdf5",
              color: m.role === "user" ? "#92400e" : "#065f46",
              maxWidth: "78%",
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </main>

      <form onSubmit={sendMessage} style={{
        display: "flex", padding: "0.75rem", gap: "0.5rem",
        background: "#fff", borderTop: "1px solid #ddd"
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask for a recipe (e.g., 'dal for 2')..."
          style={{
            flex: 1, padding: "0.6rem 0.8rem",
            borderRadius: 8, border: "1px solid #ddd"
          }}
        />
        <button disabled={loading} type="submit" style={{
          padding: "0.5rem 0.9rem",
          borderRadius: 8, border: "none",
          background: "#ef4444", color: "#fff",
          fontWeight: 500
        }}>
          {loading ? "Cooking..." : "Send"}
        </button>
      </form>
    </div>
  );
}
