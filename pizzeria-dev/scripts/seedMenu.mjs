// Carga el catálogo real de Pizzería Santino (empanadas, faina, pizzas
// familiares y promociones) en la colección "products" de Firestore, con el
// mismo esquema { name, cat, price } que ya usa el resto de la app (Pedidos,
// Stock). Se puede correr las veces que haga falta: siempre vuelve a
// escribir los mismos documentos (por id), así que sirve tanto para la carga
// inicial como para actualizar precios más adelante editando este archivo.
//
//   npm run seed:menu
//
// Requiere el mismo serviceAccountKey.json que scripts/seed.mjs (Firebase
// Console > Configuración del proyecto > Cuentas de servicio > Generar
// nueva clave privada), guardado en la raíz del proyecto. Nunca se sube al
// repositorio (ya está en .gitignore).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(
    `No se encontró serviceAccountKey.json en la raíz del proyecto.\n` +
    `Generalo desde Firebase Console > Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada,\n` +
    `guardalo como "${keyPath}" y volvé a correr "npm run seed:menu".`
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const CAT = {
  EMPANADAS: "Empanadas",
  FAINA: "Faina",
  PIZZAS: "Pizzas Familiares",
  PROMO_ALMUERZO: "Promociones Almuerzo",
  PROMO_DIA: "Promociones Todo el Día",
  PROMO_MOSTRADOR: "Promociones Mostrador",
};

const EMPANADA_PRICE = 2400;
const EMPANADAS = [
  ["cs", "CS · Carne suave"],
  ["ca", "CA · Carne suave con aceitunas trozadas"],
  ["cp", "CP · Carne picante"],
  ["cd", "CD · Carne dulce"],
  ["cc", "CC · Carne cortada a cuchillo"],
  ["st", "ST · Salteña"],
  ["po", "PO · Pollo"],
  ["ps", "PS · Pollo con salsa blanca"],
  ["pc", "PC · Pollo con cebolla caramelizada"],
  ["pm", "PM · Pollo a la mostaza y miel"],
  ["pd", "PD · Pollo y cheddar"],
  ["jq", "JQ · Jamón y queso"],
  ["qc", "QC · Queso y cebolla"],
  ["ve", "VE · Verdura (espinaca y salsa blanca)"],
  ["cm", "CM · Choclo con salsa blanca y muzzarella"],
  ["rj", "RJ · Roquefort con jamón"],
  ["ra", "RA · Roquefort, apio y nuez"],
  ["pj", "PJ · Provolone con jamón"],
  ["ch", "CH · Cantimpalo"],
  ["cb", "CB · Calabresa"],
  ["ta", "TA · Capresse"],
  ["4q", "4Q · Cuatro quesos"],
  ["pch", "PCH · Panceta, muzzarella y cheddar"],
  ["cr", "CR · Carbonara (panceta, huevo y muzza)"],
  ["ci", "CI · Panceta y ciruelas"],
  ["sch", "SCH · Salchicha cheddar y muzzarella"],
  ["hch", "HCH · Hamburguesa y cheddar"],
  ["mc", "MC · Calabaza y muzzarella"],
  ["bch", "BCH · Bondiola y cheddar"],
  ["bb", "BB · Bondiola y barbacoa"],
  ["bp", "BP · Bondiola y provoleta"],
].map(([code, name]) => ({
  id: `emp_${code}`,
  name,
  cat: CAT.EMPANADAS,
  price: EMPANADA_PRICE,
}));

const FAINA = [
  { id: "faina_tradicional_porcion", name: "Faina tradicional — 1 porción", cat: CAT.FAINA, price: 1500 },
  { id: "faina_tradicional_entera", name: "Faina tradicional — entera (8 porciones)", cat: CAT.FAINA, price: 8000 },
  { id: "faina_verdeo_porcion", name: "Faina al verdeo — 1 porción", cat: CAT.FAINA, price: 3000 },
  { id: "faina_verdeo_entera", name: "Faina al verdeo — entera (4 porciones)", cat: CAT.FAINA, price: 10000 },
  { id: "faina_jamonqueso_porcion", name: "Faina rellena jamón & queso — 1 porción", cat: CAT.FAINA, price: 4000 },
  { id: "faina_jamonqueso_entera", name: "Faina rellena jamón & queso — entera (4 porciones)", cat: CAT.FAINA, price: 12000 },
  { id: "faina_cebollaqueso_porcion", name: "Faina rellena cebolla & queso — 1 porción", cat: CAT.FAINA, price: 4000 },
  { id: "faina_cebollaqueso_entera", name: "Faina rellena cebolla & queso — entera (4 porciones)", cat: CAT.FAINA, price: 12000 },
];

const PIZZAS = [
  { id: "pizza_tradicional", name: "Pizza familiar Tradicional (4 sabores: jamón, napo, muzza & fugazzeta)", cat: CAT.PIZZAS, price: 25000 },
  { id: "pizza_especial", name: "Pizza familiar Especial (4 sabores: jamón c/morrón, provolone, doble muzza & calabresa)", cat: CAT.PIZZAS, price: 30000 },
  { id: "pizza_santino", name: "Pizza familiar Santino (4 sabores: palmitos, muzza y huevo, provolone c/calabresa & rúcula)", cat: CAT.PIZZAS, price: 31000 },
  { id: "pizza_deluxe", name: "Pizza familiar Deluxe (4 sabores: crudo c/rúcula, provo c/roquefort, doble muzza & panceta c/cheddar)", cat: CAT.PIZZAS, price: 33000 },
  { id: "pizza_picada", name: "Pizza familiar Picada (6 sabores: muzza, napo, calabresa, provo, jamón & fugazzeta)", cat: CAT.PIZZAS, price: 28000 },
  { id: "pizza_picada_santino", name: "Pizza familiar Picada Santino (6 sabores: doble muzza, americana, jamón c/morrón, muzza c/huevo, jamón c/palmito & fugazzeta)", cat: CAT.PIZZAS, price: 32000 },
  { id: "pizza_clasica", name: "Pizza familiar Clásica (3 sabores: muzza, jamón & napolitana)", cat: CAT.PIZZAS, price: 26000 },
  { id: "pizza_triple_completa", name: "Pizza familiar Triple completa (3 sabores: crudo rúcula, jamón c/ananá & jamón, palmitos, morrón)", cat: CAT.PIZZAS, price: 35000 },
];

const PROMO_ALMUERZO = [
  { n: 1, name: "3 Empanadas + 1 Bebida", price: 8000 },
  { n: 2, name: "Individual de muzza + 1 Bebida", price: 8500 },
  { n: 3, name: "Individual de muzza + 2 Empanadas + Agua saborizada 1.5lt", price: 13500 },
  { n: 4, name: "18 Empanadas + 1 Gaseosa 2lt", price: 39000 },
  { n: 5, name: "Grande de muzza + 6 Empanadas + 1 Gaseosa 2lt", price: 25000 },
  { n: 6, name: "Grande de muzza + 4 porciones de faina + 1 Gaseosa 2lt", price: 20000 },
].map((p) => ({
  id: `promo_${p.n}`,
  name: `Promo ${p.n} (almuerzo) · ${p.name}`,
  cat: CAT.PROMO_ALMUERZO,
  price: p.price,
}));

const PROMO_DIA = [
  { n: 15, name: "Grande de muzza + 6 Empanadas", price: 26000 },
  { n: 16, name: "Grande de jamón + 6 Empanadas", price: 30000 },
  { n: 17, name: "Grande de muzza + 12 Empanadas", price: 39000 },
  { n: 18, name: "Grande de muzza + Grande de jamón & morrón", price: 33000 },
  { n: 19, name: "Grande de muzza + Grande de jamón + 4 porciones de faina", price: 35000 },
  { n: 20, name: "Grande de muzza + Grande de jamón + Grande de fugazzeta", price: 46000 },
].map((p) => ({
  id: `promo_${p.n}`,
  name: `Promo ${p.n} (todo el día) · ${p.name}`,
  cat: CAT.PROMO_DIA,
  price: p.price,
}));

const PROMO_MOSTRADOR = [
  { id: "promo_7_12", name: "Promo 7 (mostrador) · Empanadas x12", price: 25000 },
  { id: "promo_7_24", name: "Promo 7 (mostrador) · Empanadas x24", price: 49000 },
  { id: "promo_7_36", name: "Promo 7 (mostrador) · Empanadas x36", price: 72000 },
  { id: "promo_8_1", name: "Promo 8 (mostrador) · Grande de muzza x1", price: 12000 },
  { id: "promo_8_2", name: "Promo 8 (mostrador) · Grande de muzza x2", price: 22000 },
  { id: "promo_8_3", name: "Promo 8 (mostrador) · Grande de muzza x3", price: 30000 },
  { id: "promo_9_1", name: "Promo 9 (mostrador) · Familiar de muzza x1", price: 18000 },
  { id: "promo_9_2", name: "Promo 9 (mostrador) · Familiar de muzza x2", price: 33000 },
  { id: "promo_9_3", name: "Promo 9 (mostrador) · Familiar de muzza x3", price: 45000 },
  { id: "promo_10", name: "Promo 10 (mostrador) · Grande de muzzarella + Grande de napolitana", price: 25000 },
  { id: "promo_11", name: "Promo 11 (mostrador) · Grande de muzza + 6 Empanadas", price: 25000 },
  { id: "promo_12", name: "Promo 12 (mostrador) · Grande de jamón + 6 Empanadas", price: 29000 },
  { id: "promo_13", name: "Promo 13 (mostrador) · Grande de muzza + Grande de fugazzeta + Grande de napolitana", price: 39000 },
  { id: "promo_14", name: "Promo 14 (mostrador) · 2 Grandes de muzza + 12 Empanadas", price: 45000 },
].map((p) => ({ ...p, cat: CAT.PROMO_MOSTRADOR }));

const PRODUCTS = [
  ...EMPANADAS,
  ...FAINA,
  ...PIZZAS,
  ...PROMO_ALMUERZO,
  ...PROMO_DIA,
  ...PROMO_MOSTRADOR,
];

async function main() {
  console.log(`Cargando catálogo en Firestore (${PRODUCTS.length} productos)...\n`);
  const chunks = [];
  for (let i = 0; i < PRODUCTS.length; i += 400) chunks.push(PRODUCTS.slice(i, i + 400));

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((p) => {
      const { id, ...data } = p;
      batch.set(db.collection("products").doc(id), data);
    });
    await batch.commit();
  }

  console.log(`Empanadas: ${EMPANADAS.length}`);
  console.log(`Faina: ${FAINA.length}`);
  console.log(`Pizzas familiares: ${PIZZAS.length}`);
  console.log(`Promos almuerzo: ${PROMO_ALMUERZO.length}`);
  console.log(`Promos todo el día: ${PROMO_DIA.length}`);
  console.log(`Promos mostrador: ${PROMO_MOSTRADOR.length}`);
  console.log(`\nListo. Total cargado: ${PRODUCTS.length} productos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error al cargar el catálogo:", err);
  process.exit(1);
});
