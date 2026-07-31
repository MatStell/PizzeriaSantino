import React, { useMemo, useState } from "react";
import { AlertTriangle, Plus, X, PackagePlus, ClipboardEdit, Pencil, Check } from "lucide-react";
import { C } from "../theme.js";
import {
  restock,
  adjustStock,
  addIngredient,
  updateMinStock,
  updateRecipe,
} from "../services/stock.js";

const KIND_LABEL = { compra: "Compra", consumo: "Consumo", ajuste: "Ajuste" };
const KIND_TONE = {
  compra: { bg: C.basilBg, fg: C.basilDark },
  consumo: { bg: C.tomatoBg, fg: C.tomatoDark },
  ajuste: { bg: C.crustBg, fg: C.crustDark },
};

const fmtWhen = (ts) => {
  if (!ts?.toDate) return "recién";
  return ts.toDate().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Stock({ ingredients, products, recipes, movements, showToast }) {
  const [movementModal, setMovementModal] = useState(null); // { mode: 'restock'|'adjust', ingredient }
  const [addOpen, setAddOpen] = useState(false);
  const ingredientById = useMemo(
    () => Object.fromEntries(ingredients.map((i) => [i.id, i])),
    [ingredients]
  );

  const sortedIngredients = [...ingredients].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: C.ink }}>
              Ingredientes (kg disponibles)
            </h3>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded"
              style={{ background: C.crustBg, color: C.crustDark }}
            >
              <Plus size={13} /> Ingrediente
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {sortedIngredients.map((ing) => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                onRestock={() => setMovementModal({ mode: "restock", ingredient: ing })}
                onAdjust={() => setMovementModal({ mode: "adjust", ingredient: ing })}
                showToast={showToast}
              />
            ))}
            {sortedIngredients.length === 0 && (
              <div className="text-xs rounded-md p-3 text-center" style={{ border: `1px dashed ${C.border}`, color: C.muted }}>
                Sin ingredientes cargados todavía
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Recetario
          </h3>
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: C.board, border: "6px solid #4A3826" }}>
            {products.map((p) => (
              <RecipeCard key={p.id} product={p} recipe={recipes[p.id] || {}} ingredients={ingredients} showToast={showToast} />
            ))}
            {products.length === 0 && (
              <span className="text-xs" style={{ color: "#B9C4B4" }}>Sin productos cargados todavía</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
          Historial de movimientos
        </h3>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm" style={{ background: C.paper }}>
            <thead>
              <tr style={{ background: C.cream, color: C.muted }}>
                <th className="text-left px-3 py-2 font-medium">Fecha</th>
                <th className="text-left px-3 py-2 font-medium">Ingrediente</th>
                <th className="text-left px-3 py-2 font-medium">Tipo</th>
                <th className="text-left px-3 py-2 font-medium">Kg</th>
                <th className="text-left px-3 py-2 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-3 py-2 text-xs" style={{ color: C.muted }}>{fmtWhen(m.createdAt)}</td>
                  <td className="px-3 py-2" style={{ color: C.ink }}>
                    {ingredientById[m.ingredientId]?.name || "(eliminado)"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: KIND_TONE[m.kind]?.bg, color: KIND_TONE[m.kind]?.fg }}
                    >
                      {KIND_LABEL[m.kind] || m.kind}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: m.kg < 0 ? C.tomatoDark : C.basilDark }}>
                    {m.kg > 0 ? "+" : ""}{m.kg} kg
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: C.muted }}>{m.note || "—"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-xs" style={{ color: C.muted }}>
                    Todavía no hay movimientos de stock registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {movementModal && (
        <MovementModal
          mode={movementModal.mode}
          ingredient={movementModal.ingredient}
          onClose={() => setMovementModal(null)}
          showToast={showToast}
        />
      )}
      {addOpen && (
        <AddIngredientModal onClose={() => setAddOpen(false)} showToast={showToast} />
      )}
    </div>
  );
}

function IngredientRow({ ingredient, onRestock, onAdjust, showToast }) {
  const [editingMin, setEditingMin] = useState(false);
  const [minDraft, setMinDraft] = useState(ingredient.min);
  const low = ingredient.kg <= ingredient.min;
  const pct = Math.min(100, (ingredient.kg / (ingredient.min * 2 || 1)) * 100);

  const saveMin = async () => {
    const value = Math.max(0, parseFloat(minDraft) || 0);
    setEditingMin(false);
    try {
      await updateMinStock(ingredient.id, value);
    } catch {
      showToast("No se pudo actualizar el mínimo");
    }
  };

  return (
    <div className="rounded-md p-3" style={{ background: C.paper, border: `1px solid ${low ? "#E3B08A" : C.border}` }}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium" style={{ color: C.ink }}>{ingredient.name}</span>
        <div className="flex items-center gap-2">
          {low && <AlertTriangle size={13} style={{ color: C.crustDark }} />}
          <span className="text-xs font-mono" style={{ color: C.muted }}>{ingredient.kg} kg / mín</span>
          {editingMin ? (
            <span className="flex items-center gap-1">
              <input
                autoFocus
                type="number"
                min={0}
                value={minDraft}
                onChange={(e) => setMinDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveMin()}
                className="w-14 px-1 py-0.5 rounded text-xs outline-none"
                style={{ border: `1px solid ${C.border}` }}
              />
              <button onClick={saveMin}><Check size={13} style={{ color: C.basilDark }} /></button>
            </span>
          ) : (
            <button onClick={() => { setMinDraft(ingredient.min); setEditingMin(true); }} className="flex items-center gap-0.5 text-xs font-mono" style={{ color: C.muted }}>
              {ingredient.min} kg <Pencil size={11} />
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full mb-2" style={{ background: C.border }}>
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: low ? C.crust : C.basil }} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRestock}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1 rounded"
          style={{ background: C.basilBg, color: C.basilDark }}
        >
          <PackagePlus size={12} /> Reponer
        </button>
        <button
          onClick={onAdjust}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1 rounded"
          style={{ background: C.crustBg, color: C.crustDark }}
        >
          <ClipboardEdit size={12} /> Ajustar
        </button>
      </div>
    </div>
  );
}

function MovementModal({ mode, ingredient, onClose, showToast }) {
  const [kg, setKg] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRestock = mode === "restock";

  const submit = async () => {
    const value = parseFloat(kg);
    if (isNaN(value) || value < 0) return;
    setSubmitting(true);
    try {
      if (isRestock) {
        await restock(ingredient.id, value, note);
        showToast(`Repusiste ${value} kg de ${ingredient.name}`);
      } else {
        await adjustStock(ingredient.id, value, note);
        showToast(`Ajustaste el stock de ${ingredient.name} a ${value} kg`);
      }
      onClose();
    } catch {
      showToast("No se pudo registrar el movimiento");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(43,35,32,0.45)" }}>
      <div className="w-full max-w-sm rounded-lg" style={{ background: C.paper }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-base font-bold" style={{ color: C.ink }}>
            {isRestock ? "Reponer stock" : "Ajustar stock"} — {ingredient.name}
          </h2>
          <button onClick={onClose}><X size={18} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: C.muted }}>
              {isRestock ? `Kg a sumar (stock actual: ${ingredient.kg} kg)` : "Nuevo valor de stock (kg)"}
            </label>
            <input
              autoFocus
              type="number"
              min={0}
              step="0.1"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              className="px-2.5 py-1.5 rounded text-sm outline-none"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: C.muted }}>Nota (opcional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isRestock ? "Proveedor, factura, etc." : "Motivo del ajuste"}
              className="px-2.5 py-1.5 rounded text-sm outline-none"
              style={{ border: `1px solid ${C.border}` }}
            />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            disabled={submitting || kg === ""}
            onClick={submit}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ background: submitting || kg === "" ? C.border : C.tomato }}
          >
            {submitting ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddIngredientModal({ onClose, showToast }) {
  const [name, setName] = useState("");
  const [kg, setKg] = useState("0");
  const [min, setMin] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addIngredient(name.trim(), parseFloat(kg) || 0, parseFloat(min) || 0);
      showToast(`Ingrediente "${name.trim()}" agregado`);
      onClose();
    } catch {
      showToast("No se pudo agregar el ingrediente");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(43,35,32,0.45)" }}>
      <div className="w-full max-w-sm rounded-lg" style={{ background: C.paper }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-base font-bold" style={{ color: C.ink }}>Nuevo ingrediente</h2>
          <button onClick={onClose}><X size={18} style={{ color: C.muted }} /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: C.muted }}>Nombre</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Rúcula" className="px-2.5 py-1.5 rounded text-sm outline-none" style={{ border: `1px solid ${C.border}` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Stock inicial (kg)</label>
              <input type="number" min={0} step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} className="px-2.5 py-1.5 rounded text-sm outline-none" style={{ border: `1px solid ${C.border}` }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Mínimo (kg)</label>
              <input type="number" min={0} step="0.1" value={min} onChange={(e) => setMin(e.target.value)} className="px-2.5 py-1.5 rounded text-sm outline-none" style={{ border: `1px solid ${C.border}` }} />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            disabled={submitting || !name.trim()}
            onClick={submit}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ background: submitting || !name.trim() ? C.border : C.tomato }}
          >
            {submitting ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ product, recipe, ingredients, showToast }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(recipe);
  const [newIngId, setNewIngId] = useState("");
  const [saving, setSaving] = useState(false);

  const available = ingredients.filter((i) => !(i.id in draft));
  const ingredientById = useMemo(() => Object.fromEntries(ingredients.map((i) => [i.id, i])), [ingredients]);

  const startEdit = () => {
    setDraft(recipe);
    setEditing(true);
  };

  const setGrams = (ingId, grams) => setDraft((d) => ({ ...d, [ingId]: grams }));
  const removeIng = (ingId) => setDraft((d) => {
    const copy = { ...d };
    delete copy[ingId];
    return copy;
  });
  const addIng = () => {
    if (!newIngId) return;
    setDraft((d) => ({ ...d, [newIngId]: 0 }));
    setNewIngId("");
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateRecipe(product.id, draft);
      showToast(`Receta de "${product.name}" actualizada`);
      setEditing(false);
    } catch {
      showToast("No se pudo guardar la receta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderBottom: `1px solid ${C.boardLine}`, paddingBottom: 8 }}>
      <div className="flex items-center justify-between">
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 19, color: C.chalk, lineHeight: 1 }}>
          {product.name}
        </div>
        {!editing && (
          <button onClick={startEdit} className="text-xs" style={{ color: "#B9C4B4" }}>
            <Pencil size={12} />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="text-xs mt-1" style={{ color: "#B9C4B4", fontFamily: "'Inter', sans-serif" }}>
          {Object.entries(recipe).length === 0
            ? "Sin receta cargada"
            : Object.entries(recipe).map(([ing, g]) => `${ingredientById[ing]?.name || "?"} ${g}g`).join(" · ")}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-1.5">
          {Object.entries(draft).map(([ingId, grams]) => (
            <div key={ingId} className="flex items-center gap-2 text-xs">
              <span className="flex-1" style={{ color: C.chalk }}>{ingredientById[ingId]?.name || "?"}</span>
              <input
                type="number"
                min={0}
                value={grams}
                onChange={(e) => setGrams(ingId, parseFloat(e.target.value) || 0)}
                className="w-16 px-1.5 py-0.5 rounded text-xs outline-none"
                style={{ border: "1px solid #4A3826", background: C.chalk }}
              />
              <span style={{ color: "#B9C4B4" }}>g</span>
              <button onClick={() => removeIng(ingId)}><X size={12} style={{ color: "#B9C4B4" }} /></button>
            </div>
          ))}

          {available.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <select
                value={newIngId}
                onChange={(e) => setNewIngId(e.target.value)}
                className="flex-1 px-1.5 py-1 rounded text-xs outline-none"
                style={{ border: "1px solid #4A3826", background: C.chalk }}
              >
                <option value="">Agregar ingrediente...</option>
                {available.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              <button onClick={addIng}><Plus size={13} style={{ color: "#B9C4B4" }} /></button>
            </div>
          )}

          <div className="flex gap-2 mt-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{ background: C.basil, color: "#fff" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{ background: "transparent", color: "#B9C4B4", border: "1px solid #4A3826" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
