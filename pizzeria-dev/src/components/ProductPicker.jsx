import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { C, fmtMoney } from "../theme.js";
import { buildSearchIndex, searchIndex } from "../utils/search.js";

const RESULT_LIMIT = 40;

// Buscador de gustos para armar el pedido: escribís "muzza", "huevo" o el
// código de la empanada ("JQ") y agregás con Enter o tocando el resultado.
export default function ProductPicker({ products, onAdd, qtyById = {} }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const index = useMemo(() => buildSearchIndex(products), [products]);
  const cats = useMemo(() => {
    const seen = [];
    products.forEach((p) => {
      if (p.cat && !seen.includes(p.cat)) seen.push(p.cat);
    });
    return seen;
  }, [products]);

  const { items, total } = useMemo(
    () => searchIndex(index, q, { cat: cat || undefined, limit: RESULT_LIMIT }),
    [index, q, cat]
  );

  useEffect(() => setActive(0), [q, cat]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const add = (product) => {
    if (!product) return;
    onAdd(product);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      add(items[active]);
    } else if (e.key === "Escape" && q) {
      e.preventDefault();
      setQ("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Buscar gusto, ingrediente o código (JQ, muzza, huevo...)"
          className="w-full pl-8 pr-8 py-2.5 rounded-md text-sm outline-none"
          style={{ border: `1px solid ${C.border}`, background: C.paper, color: C.ink }}
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} style={{ color: C.muted }} />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {[{ id: "", label: "Todo" }, ...cats.map((c) => ({ id: c, label: c }))].map((chip) => {
          const on = cat === chip.id;
          return (
            <button
              key={chip.id || "all"}
              type="button"
              onClick={() => setCat(chip.id)}
              className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{
                background: on ? C.ink : C.cream,
                color: on ? "#FFF7EA" : C.inkSoft,
                border: `1px solid ${on ? C.ink : C.border}`,
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div
        ref={listRef}
        className="rounded-md overflow-y-auto max-h-56 sm:max-h-64"
        style={{ border: `1px solid ${C.border}`, background: C.paper }}
      >
        {products.length === 0 && (
          <div className="px-3 py-6 text-center text-xs" style={{ color: C.muted }}>
            Todavía no hay productos en la base.
            <br />
            Cargalos desde <strong style={{ color: C.inkSoft }}>Stock → Cargar menú</strong>.
          </div>
        )}
        {products.length > 0 && items.length === 0 && (
          <div className="px-3 py-6 text-center text-xs" style={{ color: C.muted }}>
            Sin resultados para “{q}”
          </div>
        )}
        {items.map((p, i) => {
          const qty = qtyById[p.id] || 0;
          return (
            <button
              key={p.id}
              type="button"
              data-idx={i}
              onClick={() => add(p)}
              onMouseEnter={() => setActive(i)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
              style={{
                background: i === active ? C.cream : "transparent",
                borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate" style={{ color: C.ink }}>
                  {p.name}
                </div>
                <div className="text-xs truncate" style={{ color: C.muted }}>
                  {p.cat}
                </div>
              </div>
              <span className="text-sm font-semibold shrink-0" style={{ color: C.ink }}>
                {fmtMoney(p.price)}
              </span>
              <span
                className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{
                  background: qty ? C.tomatoBg : C.crustBg,
                  color: qty ? C.tomatoDark : C.crustDark,
                }}
              >
                {qty ? qty : <Plus size={13} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-xs" style={{ color: C.muted }}>
        {total > items.length
          ? `Mostrando ${items.length} de ${total} — afiná la búsqueda`
          : `${total} producto${total === 1 ? "" : "s"}`}
        {" · "}Enter agrega el resaltado
      </div>
    </div>
  );
}
