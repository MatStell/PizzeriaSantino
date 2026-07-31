import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { consumeForOrder } from "./stock.js";
import { STATUSES } from "../constants.js";

async function upsertCustomer(name, phone, address, day) {
  const q = query(collection(db, "customers"), where("name", "==", name));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(collection(db, "customers"), {
      name,
      phone: phone || "-",
      address: address || "-",
      lastOrder: day,
      orders: 1,
      prefs: "-",
    });
  } else {
    await updateDoc(snap.docs[0].ref, { lastOrder: day, orders: increment(1) });
  }
}

export async function createOrder({ name, phone, address, type, channel, pay, items, total, recipes }) {
  const day = new Date().toISOString().slice(0, 10);
  const ref = await addDoc(collection(db, "orders"), {
    customer: name,
    phone: phone || "-",
    address: address || "-",
    type,
    channel,
    pay,
    items,
    status: "Nuevo",
    day,
    total,
    deliveryPerson: null,
    createdAt: serverTimestamp(),
  });

  await Promise.all([
    consumeForOrder(items, recipes, ref.id),
    upsertCustomer(name, phone, address, day),
  ]);

  return ref.id;
}

export async function advanceOrder(order) {
  const idx = STATUSES.indexOf(order.status);
  if (idx === STATUSES.length - 1) return;
  const nextStatus = STATUSES[idx + 1];
  const deliveryPerson =
    order.type === "Delivery" && nextStatus === "Listo"
      ? (Math.random() < 0.5 ? "Repartidor 1" : "Repartidor 2")
      : order.deliveryPerson || null;
  await updateDoc(doc(db, "orders", order.id), { status: nextStatus, deliveryPerson });
}
