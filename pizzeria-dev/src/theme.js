// ---------- Design tokens & shared formatters ----------
export const C = {
  ink: "#2B2320",
  inkSoft: "#4A3F38",
  cream: "#FAF3E6",
  paper: "#FFFDF8",
  border: "#E7DCC6",
  tomato: "#C23B22",
  tomatoDark: "#9E2E1A",
  tomatoBg: "#FBE7E0",
  basil: "#4C7A51",
  basilDark: "#375B3B",
  basilBg: "#E7F0E4",
  crust: "#C98A2B",
  crustDark: "#96661D",
  crustBg: "#FBEFDA",
  board: "#28352B",
  boardLine: "#3D4C40",
  chalk: "#EFE9D8",
  gray: "#9C9184",
  muted: "#8A7F73",
};

export const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

export const daysSince = (dateStr) => {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  return Math.round((new Date() - d) / (1000 * 60 * 60 * 24));
};

export const fmtMoney = (n) => "$" + Math.round(n || 0).toLocaleString("es-AR");

export const fmtDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
};
