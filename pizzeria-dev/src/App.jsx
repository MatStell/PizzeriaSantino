import React, { useState, useMemo } from "react";
import {
  Home, ClipboardList, Package, Users, BarChart3, Plus, X, Search,
  Truck, Store, Flame, ChefHat, CheckCircle2, AlertTriangle, Phone,
  MapPin, Clock, TrendingUp, DollarSign, ShoppingBag, Send, LogOut
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { C, fmtMoney, fmtDate, daysSince, todayStr } from "./theme.js";
import { STATUSES } from "./constants.js";
import { useAuth } from "./contexts/AuthContext.jsx";
import { useCollection } from "./hooks/useCollection.js";
import { createOrder as createOrderService, advanceOrder as advanceOrderService } from "./services/orders.js";
import Login from "./components/Login.jsx";
import Stock from "./components/Stock.jsx";

const STATUS_LABEL = {
  Nuevo: "Nuevo",
  Cocina: "En cocina",
  Horno: "En horno",
  Listo: "Listo",
  Entregado: "Entregado",
};
const STATUS_ICON = {
  Nuevo: ClipboardList,
  Cocina: ChefHat,
  Horno: Flame,
  Listo: CheckCircle2,
  Entregado: Truck,
};

const itemsTotal = (items, credit, productById) => {
  const base = items.reduce((s, it) => s + (productById[it.id]?.price || 0) * it.qty, 0);
  return credit ? Math.round(base * 1.1) : base;
};

// ---------- Small UI atoms ----------
function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: { bg: "#EFE9DC", fg: C.inkSoft },
    tomato: { bg: C.tomatoBg, fg: C.tomatoDark },
    basil: { bg: C.basilBg, fg: C.basilDark },
    crust: { bg: C.crustBg, fg: C.crustDark },
  };
  const t = tones[tone];
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

export function MetricCard({ icon: Icon, label, value, sub, tone = "ink" }) {
  const tones = {
    ink: C.ink,
    tomato: C.tomato,
    basil: C.basil,
    crust: C.crust,
  };
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-1"
      style={{ background: C.paper, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
          {label}
        </span>
        <Icon size={16} style={{ color: tones[tone] }} />
      </div>
      <span className="text-2xl font-bold" style={{ color: C.ink }}>
        {value}
      </span>
      {sub && (
        <span className="text-xs" style={{ color: C.muted }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function PizzeriaApp() {
  const { user, loading: authLoading, logout } = useAuth();
  const [tab, setTab] = useState("inicio");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const { data: products, loading: productsLoading } = useCollection("products");
  const { data: recipeDocs, loading: recipesLoading } = useCollection("recipes");
  const { data: ingredients, loading: ingredientsLoading } = useCollection("ingredients");
  const { data: customers, loading: customersLoading } = useCollection("customers");
  const { data: orders, loading: ordersLoading } = useCollection("orders", { orderByField: "createdAt", direction: "desc" });
  const { data: movements } = useCollection("stockMovements", { orderByField: "createdAt", direction: "desc", limitTo: 100 });

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const recipes = useMemo(() => {
    const map = {};
    recipeDocs.forEach(({ id, ...ingredientsGrams }) => {
      map[id] = ingredientsGrams;
    });
    return map;
  }, [recipeDocs]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  if (authLoading) return null;
  if (!user) return <Login />;

  const dataLoading = productsLoading || recipesLoading || ingredientsLoading || customersLoading || ordersLoading;

  const liveOrders = orders.filter((o) => o.status !== "Entregado");
  const deliveredOrders = orders.filter((o) => o.status === "Entregado");

  const lowStock = ingredients.filter((i) => i.kg <= i.min);

  const today = todayStr();
  const todaySales = orders
    .filter((o) => o.day === today && o.status !== "Nuevo")
    .reduce((s, o) => s + o.total, 0);

  const reconquestCustomers = customers.filter((c) => daysSince(c.lastOrder) > 30);

  const createOrder = async ({ name, phone, address, type, channel, pay, items }) => {
    const total = itemsTotal(items, pay === "Crédito", productById);
    try {
      await createOrderService({ name, phone, address, type, channel, pay, items, total, recipes });
      showToast(`Pedido creado para ${name}`);
      setModalOpen(false);
    } catch (err) {
      showToast("No se pudo crear el pedido");
    }
  };

  const advanceOrder = async (order) => {
    try {
      await advanceOrderService(order);
    } catch (err) {
      showToast("No se pudo actualizar el pedido");
    }
  };

  const navItems = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "pedidos", label: "Pedidos", icon: ClipboardList },
    { id: "stock", label: "Stock", icon: Package },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "reportes", label: "Reportes", icon: BarChart3 },
  ];

  return (
    <div
      className="w-full flex"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: C.cream,
        minHeight: 640,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Caveat:wght@600;700&family=Space+Grotesk:wght@500;700&display=swap');
      `}</style>

      {/* Sidebar */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 200, background: C.ink, color: C.chalk }}
      >
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${C.boardLine}` }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 30, lineHeight: 1, color: "#FFF2DE" }}>
            Santino
          </div>
          <div className="text-xs mt-1" style={{ color: "#B9AE9E" }}>
            Pizzería · Gestión interna
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
          {navItems.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium text-left"
                style={{
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#FFF7EA" : "#C9BEAD",
                  borderLeft: active ? `3px solid ${C.tomato}` : "3px solid transparent",
                }}
              >
                <Icon size={16} />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div
          className="px-4 py-3 text-xs flex items-center justify-between gap-2"
          style={{ color: "#8B8071", borderTop: `1px solid ${C.boardLine}` }}
        >
          <span className="truncate">{user.email}</span>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="shrink-0"
            style={{ color: "#C9BEAD" }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${C.border}`, background: C.paper }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.ink }}>
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
            <p className="text-xs" style={{ color: C.muted }}>
              {tab === "pedidos" && "Tablero de pedidos en tiempo real"}
              {tab === "inicio" && `Hoy, ${fmtDate(today)}`}
              {tab === "stock" && "Control de ingredientes y recetas"}
              {tab === "clientes" && "Historial y preferencias"}
              {tab === "reportes" && "Resumen de ventas y consumo"}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold text-white"
            style={{ background: C.tomato }}
          >
            <Plus size={16} /> Nuevo pedido
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {dataLoading ? (
            <div className="text-sm" style={{ color: C.muted }}>Cargando datos...</div>
          ) : (
            <>
              {tab === "inicio" && (
                <Dashboard
                  orders={orders}
                  liveOrders={liveOrders}
                  todaySales={todaySales}
                  lowStock={lowStock}
                  reconquestCustomers={reconquestCustomers}
                  productById={productById}
                  setTab={setTab}
                />
              )}
              {tab === "pedidos" && (
                <Pedidos orders={orders} productById={productById} advanceOrder={advanceOrder} />
              )}
              {tab === "stock" && (
                <Stock
                  ingredients={ingredients}
                  products={products}
                  recipes={recipes}
                  movements={movements}
                  showToast={showToast}
                />
              )}
              {tab === "clientes" && (
                <Clientes customers={customers} showToast={showToast} />
              )}
              {tab === "reportes" && (
                <Reportes orders={deliveredOrders} productById={productById} movements={movements} ingredients={ingredients} />
              )}
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <NewOrderModal
          customers={customers}
          products={products}
          onClose={() => setModalOpen(false)}
          onCreate={createOrder}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-md text-sm font-medium text-white shadow-lg"
          style={{ background: C.ink }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ orders, liveOrders, todaySales, lowStock, reconquestCustomers, productById, setTab }) {
  const counts = STATUSES.slice(0, 4).map((s) => ({
    status: s,
    n: liveOrders.filter((o) => o.status === s).length,
  }));

  const topProducts = useMemo(() => {
    const tally = {};
    orders.forEach((o) => o.items.forEach((it) => (tally[it.id] = (tally[it.id] || 0) + it.qty)));
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, qty]) => ({ name: productById[id]?.name || "(producto eliminado)", qty }));
  }, [orders, productById]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard icon={DollarSign} label="Ventas hoy" value={fmtMoney(todaySales)} tone="tomato" />
        <MetricCard icon={ClipboardList} label="Pedidos en curso" value={liveOrders.length} tone="ink" />
        <MetricCard icon={AlertTriangle} label="Alertas de stock" value={lowStock.length} tone="crust" sub={lowStock.length ? lowStock.map((i) => i.name).join(", ") : "Todo en orden"} />
        <MetricCard icon={Users} label="Para reconquistar" value={reconquestCustomers.length} tone="basil" sub="Sin pedir hace +30 días" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Estado de la cocina
          </h3>
          <div className="flex flex-col gap-2.5">
            {counts.map((c) => {
              const Icon = STATUS_ICON[c.status];
              return (
                <div key={c.status} className="flex items-center gap-3">
                  <Icon size={15} style={{ color: C.tomatoDark }} />
                  <span className="text-sm flex-1" style={{ color: C.inkSoft }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                  <span className="text-sm font-bold" style={{ color: C.ink }}>
                    {c.n}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setTab("pedidos")}
            className="mt-4 text-xs font-medium"
            style={{ color: C.tomatoDark }}
          >
            Ver tablero de pedidos →
          </button>
        </div>

        <div className="rounded-lg p-4" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Más vendidos (histórico)
          </h3>
          <div className="flex flex-col gap-2.5">
            {topProducts.length === 0 && (
              <span className="text-xs" style={{ color: C.muted }}>Sin datos todavía</span>
            )}
            {topProducts.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1" style={{ color: C.inkSoft }}>
                    <span>{p.name}</span>
                    <span className="font-semibold">{p.qty}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: C.border }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(p.qty / topProducts[0].qty) * 100}%`,
                        background: C.tomato,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Pedidos (Kanban) ----------
function Pedidos({ orders, productById, advanceOrder }) {
  const cols = STATUSES;
  return (
    <div className="grid grid-cols-5 gap-3 items-start">
      {cols.map((status) => {
        const list = orders.filter((o) => o.status === status);
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.inkSoft }}>
                {STATUS_LABEL[status]}
              </span>
              <span
                className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                style={{ background: C.border, color: C.ink }}
              >
                {list.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[60px]">
              {list.map((o) => (
                <OrderTicket key={o.id} order={o} productById={productById} onAdvance={() => advanceOrder(o)} />
              ))}
              {list.length === 0 && (
                <div
                  className="text-xs rounded-md p-3 text-center"
                  style={{ border: `1px dashed ${C.border}`, color: C.muted }}
                >
                  Sin pedidos
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderTicket({ order, productById, onAdvance }) {
  const isLast = order.status === "Entregado";
  const TypeIcon = order.type === "Delivery" ? Truck : Store;
  return (
    <div
      className="rounded-md p-3 flex flex-col gap-2"
      style={{ background: C.paper, border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(43,35,32,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold" style={{ color: C.tomatoDark }}>
          #{order.id.slice(0, 5)}
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
          <TypeIcon size={12} /> {order.type}
        </span>
      </div>
      <div className="text-sm font-semibold" style={{ color: C.ink }}>
        {order.customer}
      </div>
      <div
        className="text-xs font-mono flex flex-col gap-0.5 pt-1.5"
        style={{ borderTop: `1px dashed ${C.border}`, color: C.inkSoft }}
      >
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between">
            <span>{it.qty}x {productById[it.id]?.name || "(producto eliminado)"}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold" style={{ color: C.ink }}>
          {fmtMoney(order.total)}
        </span>
        <Badge tone="gray">{order.pay}</Badge>
      </div>
      {order.deliveryPerson && (
        <div className="text-xs" style={{ color: C.basilDark }}>
          {order.deliveryPerson}
        </div>
      )}
      {!isLast && (
        <button
          onClick={onAdvance}
          className="mt-1 text-xs font-semibold py-1.5 rounded"
          style={{ background: C.ink, color: "#FFF7EA" }}
        >
          Avanzar → {STATUS_LABEL[STATUSES[STATUSES.indexOf(order.status) + 1]]}
        </button>
      )}
    </div>
  );
}

// ---------- Clientes ----------
function Clientes({ customers, showToast }) {
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => daysSince(b.lastOrder) - daysSince(a.lastOrder));

  return (
    <div>
      <div className="relative mb-3 max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-8 pr-3 py-2 rounded-md text-sm outline-none"
          style={{ border: `1px solid ${C.border}`, background: C.paper, color: C.ink }}
        />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm" style={{ background: C.paper }}>
          <thead>
            <tr style={{ background: C.cream, color: C.muted }}>
              <th className="text-left px-3 py-2 font-medium">Cliente</th>
              <th className="text-left px-3 py-2 font-medium">Contacto</th>
              <th className="text-left px-3 py-2 font-medium">Preferencias</th>
              <th className="text-left px-3 py-2 font-medium">Pedidos</th>
              <th className="text-left px-3 py-2 font-medium">Último pedido</th>
              <th className="text-left px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const d = daysSince(c.lastOrder);
              const inactive = d > 30;
              return (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-3 py-2 font-medium" style={{ color: C.ink }}>
                    {c.name}
                  </td>
                  <td className="px-3 py-2" style={{ color: C.inkSoft }}>
                    <div className="flex items-center gap-1 text-xs">
                      <Phone size={11} /> {c.phone}
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: C.muted }}>
                      <MapPin size={11} /> {c.address}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: C.inkSoft }}>
                    {c.prefs}
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: C.ink }}>
                    {c.orders}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 text-xs" style={{ color: inactive ? C.crustDark : C.muted }}>
                      <Clock size={11} /> hace {d}d
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {inactive ? (
                      <button
                        onClick={() => showToast(`Oferta enviada a ${c.name}`)}
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded"
                        style={{ background: C.basilBg, color: C.basilDark }}
                      >
                        <Send size={11} /> Enviar oferta
                      </button>
                    ) : (
                      <Badge tone="basil">Activo</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Reportes ----------
const PAY_COLORS = { Efectivo: C.basil, Transferencia: C.crust, "Débito": C.tomato, "Crédito": C.inkSoft };

function Reportes({ orders, productById, movements, ingredients }) {
  const ingredientById = useMemo(() => Object.fromEntries(ingredients.map((i) => [i.id, i])), [ingredients]);

  const totalSales = orders.reduce((s, o) => s + o.total, 0);
  const avgTicket = orders.length ? totalSales / orders.length : 0;
  const estProfit = totalSales * 0.32;

  const byDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      map[o.day] = (map[o.day] || 0) + o.total;
    });
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([day, total]) => ({ day: fmtDate(day), total }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const tally = {};
    orders.forEach((o) => o.items.forEach((it) => (tally[it.id] = (tally[it.id] || 0) + it.qty)));
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .map(([id, qty]) => ({ name: productById[id]?.name || "(producto eliminado)", qty }));
  }, [orders, productById]);

  const byPay = useMemo(() => {
    const map = {};
    orders.forEach((o) => (map[o.pay] = (map[o.pay] || 0) + o.total));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const consumptionByIngredient = useMemo(() => {
    const map = {};
    movements
      .filter((m) => m.kind === "consumo")
      .forEach((m) => {
        map[m.ingredientId] = (map[m.ingredientId] || 0) + Math.abs(m.kg);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([id, kg]) => ({ name: ingredientById[id]?.name || "(ingrediente eliminado)", kg: Math.round(kg * 100) / 100 }));
  }, [movements, ingredientById]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-3">
        <MetricCard icon={DollarSign} label="Ventas (histórico)" value={fmtMoney(totalSales)} tone="tomato" />
        <MetricCard icon={TrendingUp} label="Ganancia estimada" value={fmtMoney(estProfit)} tone="basil" sub="~32% margen" />
        <MetricCard icon={ShoppingBag} label="Pedidos entregados" value={orders.length} tone="ink" />
        <MetricCard icon={ClipboardList} label="Ticket promedio" value={fmtMoney(avgTicket)} tone="crust" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Ventas por día
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} width={45} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke={C.tomato} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-4" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Métodos de pago
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byPay} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {byPay.map((entry, i) => (
                  <Cell key={i} fill={PAY_COLORS[entry.name] || C.gray} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {byPay.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs" style={{ color: C.inkSoft }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PAY_COLORS[p.name] || C.gray }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-4" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Productos más vendidos
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.inkSoft }} width={140} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="qty" fill={C.tomato} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-4" style={{ background: C.paper, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
            Consumo de ingredientes (kg)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={consumptionByIngredient} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.inkSoft }} width={140} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="kg" fill={C.basil} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------- New order modal ----------
function NewOrderModal({ customers, products, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("Delivery");
  const [channel, setChannel] = useState("WhatsApp");
  const [pay, setPay] = useState("Efectivo");
  const [items, setItems] = useState([]);
  const [prodSel, setProdSel] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const total = itemsTotal(items, pay === "Crédito", productById);

  const addItem = () => {
    if (!prodSel) return;
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === prodSel);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { id: prodSel, qty }];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const canSubmit = name.trim().length > 0 && items.length > 0 && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onCreate({ name: name.trim(), phone, address, type, channel, pay, items });
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(43,35,32,0.45)" }}
    >
      <div
        className="w-full max-w-md rounded-lg flex flex-col"
        style={{ background: C.paper, maxHeight: "88vh" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <h2 className="text-base font-bold" style={{ color: C.ink }}>
            Nuevo pedido
          </h2>
          <button onClick={onClose}>
            <X size={18} style={{ color: C.muted }} />
          </button>
        </div>

        <div className="overflow-auto px-5 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Cliente</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                list="customer-list"
                placeholder="Nombre"
                className="px-2.5 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              />
              <datalist id="customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11-..."
                className="px-2.5 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {["Delivery", "Retiro"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 py-1.5 rounded text-xs font-semibold"
                style={{
                  background: type === t ? C.ink : "transparent",
                  color: type === t ? "#FFF7EA" : C.inkSoft,
                  border: `1px solid ${type === t ? C.ink : C.border}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {type === "Delivery" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Dirección</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle y número"
                className="px-2.5 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="px-2.5 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              >
                {["WhatsApp", "Llamada", "Instagram", "Otro"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: C.muted }}>Pago</label>
              <select
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="px-2.5 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              >
                {["Efectivo", "Transferencia", "Débito", "Crédito"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}` }} className="pt-3 flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: C.muted }}>Productos</label>
            <div className="flex gap-2">
              <select
                value={prodSel}
                onChange={(e) => setProdSel(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${C.border}` }}
              />
              <button
                onClick={addItem}
                className="px-3 rounded text-sm font-semibold"
                style={{ background: C.crust, color: "#fff" }}
              >
                <Plus size={15} />
              </button>
            </div>

            {items.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span style={{ color: C.inkSoft }}>{it.qty}x {productById[it.id]?.name}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: C.ink }} className="font-medium">
                        {fmtMoney((productById[it.id]?.price || 0) * it.qty)}
                      </span>
                      <button onClick={() => removeItem(it.id)}>
                        <X size={13} style={{ color: C.muted }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div>
            <div className="text-xs" style={{ color: C.muted }}>Total</div>
            <div className="text-lg font-bold" style={{ color: C.ink }}>{fmtMoney(total)}</div>
          </div>
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white"
            style={{ background: canSubmit ? C.tomato : C.border, cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            {submitting ? "Creando..." : "Crear pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
