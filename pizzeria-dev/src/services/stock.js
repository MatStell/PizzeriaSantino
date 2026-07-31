import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";

const round2 = (n) => Math.round(n * 100) / 100;

// Descuenta stock de todos los ingredientes usados por los items de un pedido
// y deja un registro de auditoría por ingrediente, todo en una única transacción
// para evitar condiciones de carrera entre pedidos simultáneos.
export async function consumeForOrder(items, recipes, orderId) {
  const usageKg = {};
  items.forEach(({ id, qty }) => {
    const recipe = recipes[id];
    if (!recipe) return;
    Object.entries(recipe).forEach(([ingredientId, grams]) => {
      usageKg[ingredientId] = (usageKg[ingredientId] || 0) + (grams * qty) / 1000;
    });
  });

  const ingredientIds = Object.keys(usageKg);
  if (ingredientIds.length === 0) return;

  await runTransaction(db, async (tx) => {
    const refs = ingredientIds.map((id) => doc(db, "ingredients", id));
    const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));

    snaps.forEach((snap, i) => {
      const ingredientId = ingredientIds[i];
      const current = snap.exists() ? snap.data().kg || 0 : 0;
      const nextKg = Math.max(0, round2(current - usageKg[ingredientId]));
      tx.update(refs[i], { kg: nextKg });

      const moveRef = doc(collection(db, "stockMovements"));
      tx.set(moveRef, {
        ingredientId,
        kind: "consumo",
        kg: -round2(usageKg[ingredientId]),
        note: orderId ? `Pedido #${orderId}` : "",
        orderId: orderId || null,
        createdAt: serverTimestamp(),
      });
    });
  });
}

// Reponer stock (compra a proveedor).
export async function restock(ingredientId, kg, note = "") {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "ingredients", ingredientId);
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data().kg || 0 : 0;
    tx.update(ref, { kg: round2(current + kg) });

    const moveRef = doc(collection(db, "stockMovements"));
    tx.set(moveRef, {
      ingredientId,
      kind: "compra",
      kg: round2(kg),
      note,
      orderId: null,
      createdAt: serverTimestamp(),
    });
  });
}

// Ajuste manual tras un conteo físico de inventario.
export async function adjustStock(ingredientId, newKg, note = "") {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "ingredients", ingredientId);
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data().kg || 0 : 0;
    const delta = round2(newKg - current);
    tx.update(ref, { kg: round2(newKg) });

    const moveRef = doc(collection(db, "stockMovements"));
    tx.set(moveRef, {
      ingredientId,
      kind: "ajuste",
      kg: delta,
      note,
      orderId: null,
      createdAt: serverTimestamp(),
    });
  });
}

export async function updateMinStock(ingredientId, min) {
  await updateDoc(doc(db, "ingredients", ingredientId), { min });
}

export async function addIngredient(name, kg, min) {
  const ref = await addDoc(collection(db, "ingredients"), { name, kg, min });
  return ref.id;
}

export async function updateRecipe(productId, recipe) {
  await setDoc(doc(db, "recipes", productId), recipe);
}
