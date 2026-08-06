// Catálogo real de Pizzería Santino: empanadas, faina, pizzas por tamaño,
// pizzas familiares de varios sabores y promociones.
//
// Este archivo es la única fuente de verdad del menú: lo usa el script
// scripts/seedMenu.mjs para cargar/actualizar la colección "products" de
// Firestore, y sirve de referencia para los ayudantes de búsqueda de la app.
// Para cambiar un precio o agregar un gusto, se edita acá y se vuelve a
// correr "npm run seed:menu".

export const CAT = {
  EMPANADAS: "Empanadas",
  FAINA: "Faina",
  PIZZAS: "Pizzas",
  PIZZAS_FAMILIARES: "Pizzas Familiares",
  PROMO_ALMUERZO: "Promociones Almuerzo",
  PROMO_DIA: "Promociones Todo el Día",
  PROMO_MOSTRADOR: "Promociones Mostrador",
};

// ---------- Palabras clave para el buscador ----------
// Cada producto guarda un array "keywords" en Firestore para que la búsqueda
// del modal de pedidos encuentre un gusto por ingrediente ("huevo", "morrón")
// y no solo por el nombre completo.
const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const STOP = new Set([
  "con", "y", "e", "o", "de", "del", "la", "el", "los", "las", "al", "a", "en",
  "por", "sin", "mas", "sabores", "sabor", "porcion", "porciones", "entera",
  "promo", "salsa",
]);

// Sinónimos que se usan a diario en el mostrador.
const ALIASES = {
  muzzarella: ["muzza", "mozzarella", "mozza"],
  provolone: ["provo", "provoleta"],
  roquefort: ["roque"],
  napolitana: ["napo"],
  fugazzeta: ["fuga", "fugaza"],
  fugazza: ["fuga"],
  panceta: ["bacon"],
  calabresa: ["calabre", "longaniza"],
  jamon: ["jyq"],
  empanadas: ["empanada"],
  familiar: ["familiares"],
  individual: ["indiv"],
  anana: ["ananas", "pina"],
  papas: ["papa"],
  morron: ["morrones", "pimiento"],
};

export function keywordsFor(...parts) {
  const out = new Set();
  parts.filter(Boolean).forEach((part) => {
    norm(part)
      .split(" ")
      .forEach((word) => {
        if (!word || word.length < 2 || STOP.has(word)) return;
        out.add(word);
        (ALIASES[word] || []).forEach((alias) => out.add(alias));
      });
  });
  return [...out];
}

// ---------- Empanadas ($2400 la unidad) ----------
export const EMPANADA_PRICE = 2400;

const EMPANADA_ROWS = [
  ["CS", "Carne suave"],
  ["CA", "Carne suave con aceitunas trozadas"],
  ["CP", "Carne picante"],
  ["CD", "Carne dulce"],
  ["CC", "Carne cortada a cuchillo"],
  ["ST", "Salteña"],
  ["PO", "Pollo"],
  ["PS", "Pollo con salsa blanca"],
  ["PC", "Pollo con cebolla caramelizada"],
  ["PM", "Pollo a la mostaza y miel"],
  ["PD", "Pollo y cheddar"],
  ["JQ", "Jamón y queso"],
  ["QC", "Queso y cebolla"],
  ["VE", "Verdura (espinaca y salsa blanca)"],
  ["CM", "Choclo con salsa blanca y muzzarella"],
  ["RJ", "Roquefort con jamón"],
  ["RA", "Roquefort, apio y nuez"],
  ["PJ", "Provolone con jamón"],
  ["CH", "Cantimpalo"],
  ["CB", "Calabresa"],
  ["TA", "Capresse", "tomate albahaca muzzarella"],
  ["4Q", "Cuatro quesos", "muzzarella provolone roquefort cheddar"],
  ["PCH", "Panceta, muzzarella y cheddar"],
  ["CR", "Carbonara (panceta, huevo y muzzarella)"],
  ["CI", "Panceta y ciruelas"],
  ["SCH", "Salchicha cheddar y muzzarella"],
  ["HCH", "Hamburguesa y cheddar"],
  ["MC", "Calabaza y muzzarella"],
  ["BCH", "Bondiola y cheddar"],
  ["BB", "Bondiola y barbacoa"],
  ["BP", "Bondiola y provoleta"],
];

export const EMPANADAS = EMPANADA_ROWS.map(([code, flavor, extra]) => ({
  id: `emp_${code.toLowerCase()}`,
  name: `${code} · ${flavor}`,
  cat: CAT.EMPANADAS,
  price: EMPANADA_PRICE,
  code,
  flavor,
  keywords: keywordsFor(code, flavor, extra, "empanadas"),
}));

// ---------- Faina ----------
const FAINA_ROWS = [
  ["faina_tradicional_porcion", "Faina tradicional — 1 porción", 1500],
  ["faina_tradicional_entera", "Faina tradicional — entera (8 porciones)", 8000],
  ["faina_verdeo_porcion", "Faina al verdeo — 1 porción", 3000],
  ["faina_verdeo_entera", "Faina al verdeo — entera (4 porciones)", 10000],
  ["faina_jamonqueso_porcion", "Faina rellena jamón & queso — 1 porción", 4000],
  ["faina_jamonqueso_entera", "Faina rellena jamón & queso — entera (4 porciones)", 12000],
  ["faina_cebollaqueso_porcion", "Faina rellena cebolla & queso — 1 porción", 4000],
  ["faina_cebollaqueso_entera", "Faina rellena cebolla & queso — entera (4 porciones)", 12000],
];

export const FAINA = FAINA_ROWS.map(([id, name, price]) => ({
  id,
  name,
  cat: CAT.FAINA,
  price,
  keywords: keywordsFor(name, "faina"),
}));

// ---------- Pizzas por tamaño ----------
// Precios de la lista "Nuestras Pizzas": individual, grande, familiar y
// media familiar (columna 1/2).
export const PIZZA_SIZES = [
  { key: "indiv", label: "Individual" },
  { key: "grande", label: "Grande" },
  { key: "familiar", label: "Familiar" },
  { key: "media", label: "1/2 Familiar" },
];

const PIZZA_ROWS = [
  ["muzzarella", "Muzzarella", [8000, 14000, 21000, 11000]],
  ["doble_muzzarella", "Doble Muzzarella", [11000, 19000, 28000, 15000]],
  ["muzzarella_salchichas", "Muzzarella con Salchichas", [9000, 16000, 24000, 13000]],
  ["muzzarella_huevo", "Muzzarella y Huevo", [9000, 16000, 24000, 13000]],
  ["muzzarella_morron", "Muzzarella con Morrón", [10000, 18000, 27000, 14000]],
  ["muzzarella_papas_pay", "Muzzarella con Papas Pay", [9000, 16000, 24000, 13000]],
  ["americana", "Americana", [11000, 19000, 28000, 15000], "salchichas papas pay ketchup mostaza muzzarella"],
  ["jamon", "Jamón", [10000, 18000, 27000, 14000]],
  ["jamon_huevo", "Jamón y Huevo", [11000, 20000, 30000, 16000]],
  ["jamon_morron", "Jamón y Morrón", [12000, 21000, 31000, 16000]],
  ["jamon_anana", "Jamón y Ananá", [14000, 25000, 37000, 19000]],
  ["jamon_provolone", "Jamón y Provolone", [12000, 21000, 31000, 16000]],
  ["jamon_roquefort", "Jamón y Roquefort", [12000, 21000, 31000, 16000]],
  ["panceta", "Panceta", [11000, 20000, 30000, 15000]],
  ["panceta_huevo", "Panceta y Huevo", [12000, 22000, 33000, 17000]],
  ["panceta_morron", "Panceta y Morrón", [13000, 23000, 34000, 18000]],
  ["panceta_cheddar", "Panceta y Cheddar", [13000, 23000, 34000, 18000]],
  ["panceta_cheddar_huevo", "Panceta, Cheddar y Huevo", [14000, 25000, 37000, 19000]],
  ["fugazza", "Fugazza", [8000, 14000, 21000, 11000], "cebolla"],
  ["fugazzeta", "Fugazzeta", [10000, 17000, 25000, 13000], "cebolla muzzarella"],
  ["fugazzeta_jamon", "Fugazzeta con Jamón", [12000, 21000, 31000, 16000], "cebolla"],
  ["fugazzeta_panceta", "Fugazzeta con Panceta", [12000, 22000, 33000, 17000], "cebolla"],
  ["fugazzeta_huevo", "Fugazzeta con Huevo", [11000, 20000, 30000, 16000], "cebolla"],
  ["fugazzeta_morron", "Fugazzeta con Morrón", [12000, 21000, 31000, 16000], "cebolla"],
  ["napolitana", "Napolitana", [10000, 17000, 25000, 13000], "tomate ajo muzzarella"],
  ["napolitana_jamon", "Napolitana con Jamón", [12000, 21000, 31000, 16000], "tomate ajo"],
  ["napolitana_jamon_huevo", "Napolitana con Jamón y Huevo", [13000, 23000, 34000, 18000], "tomate ajo"],
  ["napolitana_provolone", "Napolitana con Provolone", [12000, 22000, 33000, 17000], "tomate ajo"],
  ["capresse", "Capresse", [10000, 17000, 25000, 13000], "tomate albahaca muzzarella"],
  ["cancha", "Cancha", [8000, 14000, 21000, 11000], "salsa de tomate"],
  ["calabresa", "Calabresa", [12000, 21000, 31000, 16000]],
  ["calabresa_morron", "Calabresa con Morrón", [13000, 24000, 36000, 19000]],
  ["cuatro_quesos", "Cuatro Quesos", [14000, 26000, 39000, 20000], "muzzarella provolone roquefort cheddar"],
  ["provolone", "Provolone", [11000, 19000, 29000, 15000]],
  ["roquefort", "Roquefort", [11000, 19000, 29000, 15000]],
  ["roquefort_especial", "Roquefort Especial", [12000, 21000, 31000, 16000]],
  ["crudo", "Crudo", [11000, 20000, 30000, 16000], "jamon crudo"],
  ["crudo_anana", "Crudo y Ananá", [15000, 27000, 40000, 21000], "jamon crudo"],
  ["crudo_huevo", "Crudo y Huevo", [12000, 22000, 33000, 17000], "jamon crudo"],
  ["crudo_morron", "Crudo y Morrón", [13000, 23000, 34000, 18000], "jamon crudo"],
  ["crudo_roquefort", "Crudo y Roquefort", [13000, 23000, 34000, 18000], "jamon crudo"],
  ["rucula", "Rúcula", [10000, 18000, 27000, 14000]],
  ["rucula_crudo", "Rúcula y Crudo", [13000, 23000, 34000, 18000], "jamon crudo"],
  ["rucula_panceta", "Rúcula y Panceta", [13000, 23000, 34000, 18000]],
  ["palmitos", "Palmitos", [11000, 20000, 30000, 16000]],
  ["palmitos_morron", "Palmitos con Morrón", [13000, 24000, 36000, 19000]],
  ["palmitos_especial", "Palmitos Especial", [16000, 29000, 45000, 23000], "muzzarella jamon huevo morron palmitos salsa golf"],
  ["santino", "Santino", [15000, 27000, 40000, 21000], "muzzarella jamon tomate huevo morron"],
  ["santino_especial", "Santino Especial", [17000, 32000, 48000, 25000], "muzzarella jamon tomate huevo morron palmitos salsa golf"],
  ["choclo", "Choclo", [11000, 19000, 28000, 15000], "muzzarella choclo en grano"],
  ["verdura", "Verdura", [12000, 21000, 31000, 16000], "espinaca muzzarella salsa blanca"],
];

export const PIZZAS = PIZZA_ROWS.flatMap(([slug, flavor, prices, extra]) =>
  PIZZA_SIZES.map((size, i) => ({
    id: `pizza_${slug}_${size.key}`,
    name: `${flavor} — ${size.label}`,
    cat: CAT.PIZZAS,
    price: prices[i],
    flavor,
    size: size.label,
    keywords: keywordsFor(flavor, extra, size.label, "pizza"),
  }))
);

// ---------- Pizzas familiares de varios sabores ----------
const FAMILIAR_ROWS = [
  ["pizza_tradicional", "Tradicional", "4 sabores: jamón, napo, muzza & fugazzeta", 25000],
  ["pizza_especial", "Especial", "4 sabores: jamón c/morrón, provolone, doble muzza & calabresa", 30000],
  ["pizza_santino", "Santino", "4 sabores: palmitos, muzza y huevo, provolone c/calabresa & rúcula", 31000],
  ["pizza_deluxe", "Deluxe", "4 sabores: crudo c/rúcula, provo c/roquefort, doble muzza & panceta c/cheddar", 33000],
  ["pizza_picada", "Picada", "6 sabores: muzza, napo, calabresa, provo, jamón & fugazzeta", 28000],
  ["pizza_picada_santino", "Picada Santino", "6 sabores: doble muzza, americana, jamón c/morrón, muzza c/huevo, jamón c/palmito & fugazzeta", 32000],
  ["pizza_clasica", "Clásica", "3 sabores: muzza, jamón & napolitana", 26000],
  ["pizza_triple_completa", "Triple completa", "3 sabores: crudo rúcula, jamón c/ananá & jamón, palmitos, morrón", 35000],
];

export const PIZZAS_FAMILIARES = FAMILIAR_ROWS.map(([id, flavor, detail, price]) => ({
  id,
  name: `Pizza familiar ${flavor} (${detail})`,
  cat: CAT.PIZZAS_FAMILIARES,
  price,
  flavor,
  size: "Familiar (12 porciones)",
  keywords: keywordsFor(flavor, detail, "pizza familiar"),
}));

// ---------- Promociones ----------
const PROMO_ALMUERZO_ROWS = [
  [1, "3 Empanadas + 1 Bebida", 8000],
  [2, "Individual de muzza + 1 Bebida", 8500],
  [3, "Individual de muzza + 2 Empanadas + Agua saborizada 1.5lt", 13500],
  [4, "18 Empanadas + 1 Gaseosa 2lt", 39000],
  [5, "Grande de muzza + 6 Empanadas + 1 Gaseosa 2lt", 25000],
  [6, "Grande de muzza + 4 porciones de faina + 1 Gaseosa 2lt", 20000],
];

export const PROMO_ALMUERZO = PROMO_ALMUERZO_ROWS.map(([n, detail, price]) => ({
  id: `promo_${n}`,
  name: `Promo ${n} (almuerzo) · ${detail}`,
  cat: CAT.PROMO_ALMUERZO,
  price,
  keywords: keywordsFor(`promo ${n}`, detail, "promo almuerzo"),
}));

const PROMO_DIA_ROWS = [
  [15, "Grande de muzza + 6 Empanadas", 26000],
  [16, "Grande de jamón + 6 Empanadas", 30000],
  [17, "Grande de muzza + 12 Empanadas", 39000],
  [18, "Grande de muzza + Grande de jamón & morrón", 33000],
  [19, "Grande de muzza + Grande de jamón + 4 porciones de faina", 35000],
  [20, "Grande de muzza + Grande de jamón + Grande de fugazzeta", 46000],
];

export const PROMO_DIA = PROMO_DIA_ROWS.map(([n, detail, price]) => ({
  id: `promo_${n}`,
  name: `Promo ${n} (todo el día) · ${detail}`,
  cat: CAT.PROMO_DIA,
  price,
  keywords: keywordsFor(`promo ${n}`, detail, "promo todo el dia"),
}));

const PROMO_MOSTRADOR_ROWS = [
  ["promo_7_12", "Promo 7 (mostrador) · Empanadas x12", 25000],
  ["promo_7_24", "Promo 7 (mostrador) · Empanadas x24", 49000],
  ["promo_7_36", "Promo 7 (mostrador) · Empanadas x36", 72000],
  ["promo_8_1", "Promo 8 (mostrador) · Grande de muzza x1", 12000],
  ["promo_8_2", "Promo 8 (mostrador) · Grande de muzza x2", 22000],
  ["promo_8_3", "Promo 8 (mostrador) · Grande de muzza x3", 30000],
  ["promo_9_1", "Promo 9 (mostrador) · Familiar de muzza x1", 18000],
  ["promo_9_2", "Promo 9 (mostrador) · Familiar de muzza x2", 33000],
  ["promo_9_3", "Promo 9 (mostrador) · Familiar de muzza x3", 45000],
  ["promo_10", "Promo 10 (mostrador) · Grande de muzzarella + Grande de napolitana", 25000],
  ["promo_11", "Promo 11 (mostrador) · Grande de muzza + 6 Empanadas", 25000],
  ["promo_12", "Promo 12 (mostrador) · Grande de jamón + 6 Empanadas", 29000],
  ["promo_13", "Promo 13 (mostrador) · Grande de muzza + Grande de fugazzeta + Grande de napolitana", 39000],
  ["promo_14", "Promo 14 (mostrador) · 2 Grandes de muzza + 12 Empanadas", 45000],
];

export const PROMO_MOSTRADOR = PROMO_MOSTRADOR_ROWS.map(([id, name, price]) => ({
  id,
  name,
  cat: CAT.PROMO_MOSTRADOR,
  price,
  keywords: keywordsFor(name, "promo mostrador"),
}));

export const PRODUCT_GROUPS = [
  { cat: CAT.EMPANADAS, items: EMPANADAS },
  { cat: CAT.FAINA, items: FAINA },
  { cat: CAT.PIZZAS, items: PIZZAS },
  { cat: CAT.PIZZAS_FAMILIARES, items: PIZZAS_FAMILIARES },
  { cat: CAT.PROMO_ALMUERZO, items: PROMO_ALMUERZO },
  { cat: CAT.PROMO_DIA, items: PROMO_DIA },
  { cat: CAT.PROMO_MOSTRADOR, items: PROMO_MOSTRADOR },
];

export const PRODUCTS = PRODUCT_GROUPS.flatMap((g) => g.items);
