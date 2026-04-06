import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onAuth();
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080c16",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Nunito', sans-serif"
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <div style={{
        width: 360, background: "#0f1520", borderRadius: 12,
        border: "1px solid #1e293b", padding: "32px 28px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/prismlogo.png" alt="PRISM" style={{ height: 36, marginBottom: 12 }} />
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#64748b",
            letterSpacing: 2, textTransform: "uppercase"
          }}>AUDIENCE INTELLIGENCE PLATFORM</div>
          <div style={{
            fontSize: 8, color: "#475569", marginTop: 4,
            letterSpacing: 1, textTransform: "uppercase"
          }}>AMERICAN LEADERSHIP STUDY</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 4 }}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 6,
                border: "1px solid #1e293b", background: "#111827", color: "#e2e8f0",
                fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none",
                boxSizing: "border-box"
              }}
              placeholder="you@company.com"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 4 }}>PASSWORD</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              minLength={6}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 6,
                border: "1px solid #1e293b", background: "#111827", color: "#e2e8f0",
                fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: "none",
                boxSizing: "border-box"
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 12, padding: "6px 10px", background: "#1f1318", borderRadius: 4 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 6, border: "none",
              background: loading ? "#334155" : "#3b82f6", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer",
              fontFamily: "'Nunito', sans-serif", letterSpacing: 0.5,
              transition: "background 0.15s"
            }}
          >
            {loading ? "..." : "SIGN IN"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 9, color: "#475569" }}>
          Contact your administrator for access
        </div>
      </div>
    </div>
  );
}
