// Carga datos iniciales de demostración en Firestore: catálogo, recetas,
// stock de ingredientes, clientes y un puñado de pedidos de ejemplo (con su
// consumo de stock ya registrado). Se corre UNA sola vez con:
//
//   npm run seed
//
// Requiere un archivo serviceAccountKey.json en la raíz del proyecto
// (Firebase Console > Configuración del proyecto > Cuentas de servicio >
// Generar nueva clave privada). Ese archivo NUNCA se sube al repositorio
// (ya está en .gitignore).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
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
    `guardalo como "${keyPath}" y volvé a correr "npm run seed".`
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const PRODUCTS = [
  { id: "p_muzza", name: "Pizza muzzarella", cat: "Pizzas", price: 9800 },
  { id: "p_napo", name: "Pizza napolitana", cat: "Pizzas", price: 11200 },
  { id: "p_fuga", name: "Pizza fugazzeta", cat: "Pizzas", price: 10500 },
  { id: "p_esp", name: "Pizza especial", cat: "Pizzas", price: 11800 },
  { id: "p_4q", name: "Pizza 4 quesos", cat: "Pizzas", price: 12500 },
  { id: "e_carne", name: "Empanada de carne", cat: "Empanadas", price: 1200 },
  { id: "e_jyq", name: "Empanada jamón y queso", cat: "Empanadas", price: 1200 },
  { id: "e_verd", name: "Empanada de verdura", cat: "Empanadas", price: 1100 },
  { id: "e_pollo", name: "Empanada de pollo", cat: "Empanadas", price: 1200 },
];

// Gramos de cada ingrediente consumidos por unidad producida.
const RECIPES = {
  p_muzza: { harina: 300, muzzarella: 250, salsa: 150 },
  p_napo: { harina: 300, muzzarella: 200, salsa: 180 },
  p_fuga: { harina: 320, muzzarella: 300, cebolla: 100 },
  p_esp: { harina: 300, muzzarella: 220, salsa: 150, jamon: 80 },
  p_4q: { harina: 300, muzzarella: 350 },
  e_carne: { harina: 60, carne: 70, cebolla: 20 },
  e_jyq: { harina: 60, jamon: 40, muzzarella: 30 },
  e_verd: { harina: 60, verdura: 60 },
  e_pollo: { harina: 60, pollo: 60 },
};

const INGREDIENTS = {
  harina: { name: "Harina", kg: 45, min: 20 },
  muzzarella: { name: "Muzzarella", kg: 16, min: 15 },
  salsa: { name: "Salsa de tomate", kg: 22, min: 10 },
  carne: { name: "Carne picada", kg: 9, min: 10 },
  jamon: { name: "Jamón", kg: 12, min: 8 },
  verdura: { name: "Verdura", kg: 6, min: 5 },
  pollo: { name: "Pollo", kg: 14, min: 10 },
  cebolla: { name: "Cebolla", kg: 10, min: 5 },
  aceitunas: { name: "Aceitunas", kg: 3, min: 5 },
};

const CUSTOMERS = [
  { name: "Juan Pérez", phone: "11-4567-8901", address: "Av. Rivadavia 1200", lastOrder: daysAgo(3), orders: 14, prefs: "Muzzarella sin aceitunas" },
  { name: "Laura Gómez", phone: "11-5678-1234", address: "Belgrano 340", lastOrder: daysAgo(49), orders: 5, prefs: "Empanadas de carne" },
  { name: "Marcos Díaz", phone: "11-3344-5566", address: "San Martín 890", lastOrder: daysAgo(4), orders: 22, prefs: "Fugazzeta" },
  { name: "Sofía Ruiz", phone: "11-2233-4455", address: "Mitre 210", lastOrder: daysAgo(60), orders: 3, prefs: "4 quesos" },
  { name: "Diego Fernández", phone: "11-9988-7766", address: "Alberdi 78", lastOrder: daysAgo(2), orders: 9, prefs: "Empanadas variadas" },
  { name: "Carla Molina", phone: "11-6655-4433", address: "Sarmiento 455", lastOrder: daysAgo(39), orders: 7, prefs: "Napolitana" },
  { name: "Pablo Suárez", phone: "11-7788-9900", address: "Av. San Martín 2500", lastOrder: daysAgo(2), orders: 30, prefs: "Especial + empanadas de pollo" },
  { name: "Valentina Torres", phone: "11-4455-6677", address: "Moreno 133", lastOrder: daysAgo(9), orders: 4, prefs: "Empanadas de verdura" },
];

const mkItems = (list) => list.map(([id, qty]) => ({ id, qty }));
const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const itemsTotal = (items, credit) => {
  const base = items.reduce((s, it) => s + productById[it.id].price * it.qty, 0);
  return credit ? Math.round(base * 1.1) : base;
};

// Pedidos entregados en los últimos 7 días (para que Reportes tenga datos).
const HISTORY = [
  { daysBack: 7, customer: "Pablo Suárez", type: "Delivery", pay: "Efectivo", items: mkItems([["p_esp", 1], ["e_pollo", 6]]) },
  { daysBack: 7, customer: "Marcos Díaz", type: "Retiro", pay: "Débito", items: mkItems([["p_fuga", 2]]) },
  { daysBack: 6, customer: "Valentina Torres", type: "Delivery", pay: "Transferencia", items: mkItems([["e_verd", 12]]) },
  { daysBack: 6, customer: "Juan Pérez", type: "Retiro", pay: "Efectivo", items: mkItems([["p_muzza", 2]]) },
  { daysBack: 5, customer: "Carla Molina", type: "Delivery", pay: "Crédito", items: mkItems([["p_napo", 1], ["e_carne", 6]]) },
  { daysBack: 5, customer: "Diego Fernández", type: "Retiro", pay: "Efectivo", items: mkItems([["p_4q", 1]]) },
  { daysBack: 4, customer: "Pablo Suárez", type: "Delivery", pay: "Débito", items: mkItems([["p_esp", 2], ["e_pollo", 12]]) },
  { daysBack: 4, customer: "Marcos Díaz", type: "Delivery", pay: "Efectivo", items: mkItems([["p_fuga", 1], ["e_jyq", 6]]) },
  { daysBack: 3, customer: "Marcos Díaz", type: "Retiro", pay: "Efectivo", items: mkItems([["p_fuga", 3]]) },
  { daysBack: 3, customer: "Valentina Torres", type: "Delivery", pay: "Transferencia", items: mkItems([["e_verd", 6], ["p_muzza", 1]]) },
  { daysBack: 2, customer: "Juan Pérez", type: "Delivery", pay: "Crédito", items: mkItems([["p_muzza", 2], ["e_carne", 6]]) },
  { daysBack: 2, customer: "Diego Fernández", type: "Retiro", pay: "Débito", items: mkItems([["e_pollo", 12]]) },
  { daysBack: 1, customer: "Pablo Suárez", type: "Delivery", pay: "Efectivo", items: mkItems([["p_esp", 1], ["p_4q", 1], ["e_pollo", 6]]) },
  { daysBack: 1, customer: "Diego Fernández", type: "Delivery", pay: "Transferencia", items: mkItems([["p_napo", 1]]) },
  { daysBack: 1, customer: "Juan Pérez", type: "Retiro", pay: "Efectivo", items: mkItems([["e_jyq", 6], ["e_carne", 6]]) },
];

// Pedidos de hoy, en distintos estados del tablero de cocina.
const LIVE = [
  { customer: "Sofía Ruiz", type: "Retiro", pay: "Efectivo", status: "Nuevo", items: mkItems([["p_4q", 1]]) },
  { customer: "Laura Gómez", type: "Delivery", pay: "Efectivo", status: "Nuevo", items: mkItems([["e_carne", 12]]) },
  { customer: "Juan Pérez", type: "Retiro", pay: "Débito", status: "Cocina", items: mkItems([["p_muzza", 1], ["e_jyq", 6]]) },
  { customer: "Marcos Díaz", type: "Delivery", pay: "Transferencia", status: "Horno", items: mkItems([["p_fuga", 2]]) },
  { customer: "Pablo Suárez", type: "Delivery", pay: "Efectivo", status: "Listo", items: mkItems([["p_esp", 1], ["e_pollo", 6]]) },
];

async function seedProducts() {
  await Promise.all(PRODUCTS.map((p) => db.collection("products").doc(p.id).set({ name: p.name, cat: p.cat, price: p.price })));
  console.log(`Productos: ${PRODUCTS.length}`);
}

async function seedRecipes() {
  await Promise.all(Object.entries(RECIPES).map(([id, recipe]) => db.collection("recipes").doc(id).set(recipe)));
  console.log(`Recetas: ${Object.keys(RECIPES).length}`);
}

async function seedIngredients() {
  await Promise.all(Object.entries(INGREDIENTS).map(([id, data]) => db.collection("ingredients").doc(id).set(data)));
  console.log(`Ingredientes: ${Object.keys(INGREDIENTS).length}`);
}

async function seedCustomers() {
  const batch = db.batch();
  CUSTOMERS.forEach((c) => batch.set(db.collection("customers").doc(), c));
  await batch.commit();
  console.log(`Clientes: ${CUSTOMERS.length}`);
}

async function seedOrdersAndMovements() {
  const all = [
    ...HISTORY.map((o) => ({ ...o, status: "Entregado", day: daysAgo(o.daysBack) })),
    ...LIVE.map((o) => ({ ...o, day: daysAgo(0) })),
  ];

  let orderCount = 0;
  let movementCount = 0;

  for (const o of all) {
    const total = itemsTotal(o.items, o.pay === "Crédito");
    const createdAt = Timestamp.fromDate(new Date(`${o.day}T12:00:00`));
    const orderRef = await db.collection("orders").add({
      customer: o.customer,
      phone: "-",
      address: o.type === "Delivery" ? "-" : "",
      type: o.type,
      channel: "WhatsApp",
      pay: o.pay,
      items: o.items,
      status: o.status,
      day: o.day,
      total,
      deliveryPerson: o.type === "Delivery" && (o.status === "Listo" || o.status === "Entregado") ? "Repartidor 1" : null,
      createdAt,
    });
    orderCount++;

    const usageKg = {};
    o.items.forEach(({ id, qty }) => {
      const recipe = RECIPES[id];
      if (!recipe) return;
      Object.entries(recipe).forEach(([ing, grams]) => {
        usageKg[ing] = (usageKg[ing] || 0) + (grams * qty) / 1000;
      });
    });

    const batch = db.batch();
    Object.entries(usageKg).forEach(([ingredientId, kg]) => {
      batch.set(db.collection("stockMovements").doc(), {
        ingredientId,
        kind: "consumo",
        kg: -Math.round(kg * 100) / 100,
        note: `Pedido inicial de demostración`,
        orderId: orderRef.id,
        createdAt,
      });
      movementCount++;
    });
    await batch.commit();
  }

  console.log(`Pedidos: ${orderCount}`);
  console.log(`Movimientos de stock (consumo): ${movementCount}`);
}

async function main() {
  console.log("Cargando datos iniciales en Firestore...\n");
  await seedProducts();
  await seedRecipes();
  await seedIngredients();
  await seedCustomers();
  await seedOrdersAndMovements();
  console.log("\nListo. Recordá crear el usuario de acceso en Firebase Console > Authentication.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error al cargar los datos:", err);
  process.exit(1);
});
