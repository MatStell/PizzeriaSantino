import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { PRODUCTS } from "../data/catalog.js";

// Carga el menú de src/data/catalog.js en la colección "products" desde la
// propia app (misma tarea que "npm run seed:menu", pero sin terminal ni
// clave privada: usa la sesión de quien está logueado).
//
// Escribe siempre los mismos documentos por id, así que se puede repetir
// cuando cambian los precios sin duplicar nada. Firestore acepta hasta 500
// operaciones por lote, por eso va de a 400.
export async function loadCatalog() {
  for (let i = 0; i < PRODUCTS.length; i += 400) {
    const batch = writeBatch(db);
    PRODUCTS.slice(i, i + 400).forEach(({ id, ...data }) => {
      batch.set(doc(db, "products", id), data);
    });
    await batch.commit();
  }
  return PRODUCTS.length;
}

export const CATALOG_SIZE = PRODUCTS.length;
