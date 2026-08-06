import React, { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { C } from "../theme.js";

const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "Usuario o contraseña incorrectos.",
  "auth/invalid-email": "El email no es válido.",
  "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en unos minutos.",
};

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(AUTH_ERROR_MESSAGES[err.code] || "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="w-full min-h-[100dvh] flex items-center justify-center p-4"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: C.cream,
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-6 sm:p-7"
        style={{ background: C.paper, border: `1px solid ${C.border}` }}
      >
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 32, lineHeight: 1, color: C.ink }}>
          Santino
        </div>
        <div className="text-xs mb-6" style={{ color: C.muted }}>
          Pizzería · Gestión interna
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: C.muted }}>Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="local@pizzeriasantino.com"
                className="w-full pl-8 pr-3 py-2 rounded-md text-sm outline-none"
                style={{ border: `1px solid ${C.border}`, color: C.ink }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: C.muted }}>Contraseña</label>
            <div className="relative">
              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-3 py-2 rounded-md text-sm outline-none"
                style={{ border: `1px solid ${C.border}`, color: C.ink }}
              />
            </div>
          </div>

          {error && (
            <div className="text-xs rounded-md px-3 py-2" style={{ background: C.tomatoBg, color: C.tomatoDark }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2 rounded-md text-sm font-semibold text-white"
            style={{ background: C.tomato, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
