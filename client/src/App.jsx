import React, { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm RasoiBot 🍲. Ask me for Indian recipes!" }
  ]);
  const [input, setInput] = useState("");

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput("");

    try {
      const resp = await fetch("http://localhost:5175/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query })
      });
      const data = await resp.json();

      let reply;
      if (data.results?.length > 0) {
        const r = data.results[0];
        reply = `Here’s a recipe: ${r.name}\n\nIngredients:\n${r.ingredients.map(i => `- ${i.quantity} ${i.unit||""} ${i.name}`).join("\n")}\n\nSteps:\n${r.steps.join("\n")}`;
      } else {
        reply = "Sorry, I couldn’t find or generate a recipe 😔";
      }

      setMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ Error: " + err.message }]);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      fontFamily: "sans-serif", background: "#f9f9f9"
    }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            textAlign: m.role === "user" ? "right" : "left",
            margin: "0.5rem 0"
          }}>
            <span style={{
              display: "inline-block",
              padding: "0.5rem 0.75rem",
              borderRadius: "1rem",
              background: m.role === "user" ? "#cce5ff" : "#e2e2e2",
              maxWidth: "70%",
              whiteSpace: "pre-wrap"
            }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", padding: "0.5rem", background: "#fff" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask for a recipe..."
          style={{ flex: 1, padding: "0.5rem", borderRadius: "1rem", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ marginLeft: "0.5rem", padding: "0.5rem 1rem", borderRadius: "1rem", border: "none", background: "#007bff", color: "#fff" }}>
          Send
        </button>
      </form>
    </div>
  );
}
