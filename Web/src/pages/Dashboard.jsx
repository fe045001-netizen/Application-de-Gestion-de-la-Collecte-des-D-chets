import StatCard from "../components/ui/StatCard";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";

export default function Dashboard({ user, points = [], trucks = [], routes = [], logs = [] }) {

  const collected  = logs.filter(l => l.status === "collecté").length;
  const problems   = logs.filter(l => l.status === "problème").length;
  const remaining  = points.length - collected;
  const activeRoutes = routes.filter(r => r.status === "en_cours").length;
  const activeTrucks = trucks.filter(t => (t.status || "").toLowerCase() === "actif").length;
  const rate = points.length > 0 ? Math.round((collected / points.length) * 100) : 0;

  const todayStr  = new Date().toISOString().split("T")[0]; // "2026-04-25"
  const todayLogs = logs.filter(l => l.timestamp?.startsWith(todayStr));

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.name} `}
        subtitle={`Tableau de bord — ${new Date().toLocaleDateString("fr-MA", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })}`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard  label="Points collectés"  value={collected}    sub="Total"                color="#0F6E56" />
        <StatCard label="Points restants"   value={remaining}    sub="À collecter"          color="#EF9F27" />
        <StatCard  label="Incidents"         value={problems}     sub="Signalés"             color="#E24B4A" />
        <StatCard label="Taux de collecte"  value={`${rate}%`}   sub="Global"               color="#378ADD" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <StatCard  label="Camions actifs"    value={activeTrucks} sub={`/ ${trucks.length} total`}      color="#7F77DD" />
        <StatCard  label="Tournées en cours" value={activeRoutes} sub={`/ ${routes.length} planifiées`} color="#1D9E75" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eee" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Derniers passages</h3>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#aaa" }}>
            {todayStr} — {todayLogs.length} passage{todayLogs.length !== 1 ? "s" : ""} aujourd'hui
          </p>
          {todayLogs.length === 0 && (
            <p style={{ color: "#aaa", fontSize: 13 }}>Aucun passage aujourd'hui</p>
          )}
          {todayLogs.slice(0, 5).map(log => {
            const point = points.find(p => Number(p.id) === Number(log.pointId));
            const route = routes.find(r => Number(r.id) === Number(log.routeId));
            return (
              <div key={log.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid #f5f5f5",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {point?.name || `Point #${log.pointId}`}
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>
                    {route?.name || `Tournée #${log.routeId}`}
                  </div>
                  {log.note && <div style={{ fontSize: 12, color: "#888" }}>{log.note}</div>}
                </div>
                <Badge status={log.status} />
              </div>
            );
          })}
        </div>

        {/* Points problématiques */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eee" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Points problématiques</h3>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "#aaa" }}>
            {problems} incident{problems !== 1 ? "s" : ""} signalé{problems !== 1 ? "s" : ""}
          </p>
          {problems === 0 && (
            <p style={{ color: "#aaa", fontSize: 13 }}>Aucun incident signalé </p>
          )}
          {logs.filter(l => l.status === "problème").map(log => {
            const point = points.find(p => Number(p.id) === Number(log.pointId));
            return (
              <div key={log.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid #f5f5f5",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {point?.name || `Point #${log.pointId}`}
                  </div>
                  <div style={{ fontSize: 12, color: "#E24B4A" }}>{log.note || "Incident signalé"}</div>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}