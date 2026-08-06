// Búsqueda tolerante para el catálogo: ignora mayúsculas, acentos y signos,
// y busca cada palabra escrita en el nombre, la categoría, el código de la
// empanada y las palabras clave (ingredientes) guardadas en Firestore.
// Así "hue mor" encuentra "Jamón y Huevo con Morrón" y "jq" encuentra la
// empanada de jamón y queso.

export const normalize = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Prepara una vez la lista de productos para no re-normalizar en cada tecla.
export function buildSearchIndex(products) {
  return products.map((p) => {
    const name = normalize(p.name);
    return {
      product: p,
      name,
      code: normalize(p.code),
      hay: [name, normalize(p.cat), normalize(p.code), normalize(p.size), (p.keywords || []).map(normalize).join(" ")]
        .filter(Boolean)
        .join(" "),
    };
  });
}

function scoreEntry(entry, tokens) {
  let score = 0;
  for (const token of tokens) {
    if (entry.code && entry.code === token) {
      score += 100;
    } else if (entry.name.startsWith(token)) {
      score += 40;
    } else if (entry.name.includes(` ${token}`)) {
      score += 20;
    } else if (entry.name.includes(token)) {
      score += 10;
    } else if (entry.hay.includes(token)) {
      // Coincide por ingrediente o palabra clave, no por el nombre.
      score += 4;
    } else {
      return -1; // Todas las palabras escritas tienen que coincidir.
    }
  }
  return score;
}

export function searchIndex(index, query, { cat, limit = 60 } = {}) {
  const pool = cat ? index.filter((e) => e.product.cat === cat) : index;
  const tokens = normalize(query).split(" ").filter(Boolean);

  if (tokens.length === 0) {
    const all = [...pool].sort((a, b) => a.name.localeCompare(b.name));
    return { items: all.slice(0, limit).map((e) => e.product), total: all.length };
  }

  const scored = [];
  for (const entry of pool) {
    const score = scoreEntry(entry, tokens);
    if (score >= 0) scored.push({ entry, score });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.name.length - b.entry.name.length ||
      a.entry.name.localeCompare(b.entry.name)
  );
  return { items: scored.slice(0, limit).map((s) => s.entry.product), total: scored.length };
}
