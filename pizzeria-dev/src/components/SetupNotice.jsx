import React from "react";
import { AlertTriangle } from "lucide-react";
import { C } from "../theme.js";

export default function SetupNotice() {
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: C.cream, minHeight: 640 }}
    >
      <div className="max-w-md rounded-lg p-6 flex flex-col gap-2" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} style={{ color: C.crustDark }} />
          <h1 className="text-base font-bold" style={{ color: C.ink }}>Falta configurar Firebase</h1>
        </div>
        <p className="text-sm" style={{ color: C.inkSoft }}>
          No encontré las variables <code>VITE_FIREBASE_*</code>. Copiá{" "}
          <code>.env.example</code> a <code>.env</code>, completalo con la
          configuración de tu proyecto de Firebase y reiniciá <code>npm run dev</code>.
        </p>
        <p className="text-xs" style={{ color: C.muted }}>
          El paso a paso completo está en el README del proyecto.
        </p>
      </div>
    </div>
  );
}
