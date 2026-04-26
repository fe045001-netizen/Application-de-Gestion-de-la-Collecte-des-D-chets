export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a1a1a" }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", color: "#777", fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}