// Carga el catálogo real de Pizzería Santino (empanadas, faina, pizzas por
// tamaño, pizzas familiares de varios sabores y promociones) en la colección
// "products" de Firestore.
//
// El menú vive en src/data/catalog.js: para cambiar un precio o agregar un
// gusto se edita ese archivo y se vuelve a correr este script. Cada producto
// se guarda con { name, cat, price } —el esquema que ya usan Pedidos y
// Stock— más los campos que alimentan el buscador del modal de pedidos:
// code (código de empanada), flavor, size y keywords (ingredientes).
//
// Se puede correr las veces que haga falta: siempre escribe los mismos
// documentos por id, así que sirve para la carga inicial y para actualizar
// precios más adelante.
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
import { PRODUCTS, PRODUCT_GROUPS } from "../src/data/catalog.js";

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

async function main() {
  console.log(`Cargando catálogo en Firestore (${PRODUCTS.length} productos)...\n`);
  const chunks = [];
  for (let i = 0; i < PRODUCTS.length; i += 400) chunks.push(PRODUCTS.slice(i, i + 400));

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(({ id, ...data }) => {
      batch.set(db.collection("products").doc(id), data);
    });
    await batch.commit();
  }

  PRODUCT_GROUPS.forEach((g) => console.log(`${g.cat}: ${g.items.length}`));
  console.log(`\nListo. Total cargado: ${PRODUCTS.length} productos.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error al cargar el catálogo:", err);
  process.exit(1);
});
