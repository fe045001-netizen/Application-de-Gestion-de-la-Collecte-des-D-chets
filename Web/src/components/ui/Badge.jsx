import { STATUS_COLORS } from "../../utils/constants";

export default function Badge({ status, label }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["inactif"] || { bg:"#eee", text:"#666", dot:"#aaa" };
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {label || status}
    </span>
  );
}  