import { useState, useEffect } from "react";
import DriverMapPage from "./pages/DriverMapPage";
import Layout      from "./components/layout/Layout";
import LoginPage   from "./pages/LoginPage";
import Dashboard   from "./pages/Dashboard";
import PointsPage  from "./pages/PointsPage";
import TrucksPage  from "./pages/TrucksPage";
import RoutesPage  from "./pages/RoutesPage";
import LogsPage    from "./pages/LogsPage";
import MyRoutePage from "./pages/MyRoutePage";
import UsersPage   from "./pages/UsersPage";

const API = "http://localhost/PhpFinalProject/api";

async function apiFetch(endpoint) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { console.error(`Non-JSON [${endpoint}]:`, text.substring(0, 300)); return []; }
  } catch (err) {
    console.error(`Réseau [${endpoint}]:`, err.message);
    return [];
  }
}

const normalizeLogs = (raw) => raw.map(l => ({
  id:        l.id,
  pointId:   parseInt(l.point_id  ?? l.pointId),
  routeId:   parseInt(l.route_id  ?? l.routeId),
  driverId:  parseInt(l.driver_id ?? l.driverId) || null,
  status:    l.status,
  note:      l.note || "",
  timestamp: l.timestamp,
}));

const normalizeRoutes = (raw) => raw.map(r => ({
  id:        r.id,
  name:      r.name,
  date:      r.date,
  status:    r.status    || "planifiée",
  truckId:   parseInt(r.truck_id  ?? r.truckId)  || null,
  truckName: r.truck_name ?? r.truckName ?? null,
  driverId:  parseInt(r.driver_id ?? r.driverId) || null,
}));

const normalizePoints = (raw) => raw.map(p => ({
  id:      p.id,
  name:    p.name,
  lat:     parseFloat(p.latitude  ?? p.lat) || 0,
  lng:     parseFloat(p.longitude ?? p.lng) || 0,
  zone:    p.zone   || "",
  type:    p.type   || "conteneur",
  status:  p.status || "actif",
  routeId: parseInt(p.route_id ?? p.routeId) || null,
}));

const normalizeTrucks = (raw) => raw.map(t => ({
  id:       t.id,
  plate:    t.plate ?? t.plate_number ?? t.immatriculation ?? "",
  model:    t.model ?? t.name ?? t.marque ?? "",
  capacity: parseInt(t.capacity) || 0,
  status:   t.status   || "actif",
  driverId: parseInt(t.driver_id ?? t.driverId) || null,
}));

const normalizeUsers = (raw) => raw.map(u => ({
  id:    u.id,
  name:  u.name  || u.email,
  email: u.email,
  role:  u.role,
}));

const ALLOWED_PAGES = {
  admin:       ["dashboard","points","trucks","routes","logs","users","driver-map"],
  responsable: ["dashboard","points","trucks","routes","logs","driver-map"],
  chauffeur:   ["dashboard","my-route","logs"],
};

export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [appReady,   setAppReady]   = useState(false);
  const [points, setPoints] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [logs,   setLogs]   = useState([]);
  const [users,  setUsers]  = useState([]);

  const loadAllData = async () => {
    setAppReady(false);
    const [rP, rT, rR, rL, rU] = await Promise.all([
      apiFetch("/points"),
      apiFetch("/trucks"),
      apiFetch("/routes"),
      apiFetch("/logs"),
      apiFetch("/users"),
    ]);
    setPoints(normalizePoints(Array.isArray(rP) ? rP : []));
    setTrucks(normalizeTrucks(Array.isArray(rT) ? rT : []));
    setRoutes(normalizeRoutes(Array.isArray(rR) ? rR : []));
    setLogs(normalizeLogs(Array.isArray(rL)     ? rL : []));
    setUsers(normalizeUsers(Array.isArray(rU)   ? rU : []));
    setAppReady(true);
  };

  const refreshAll = async () => {
    const [rP, rT, rR, rL] = await Promise.all([
      apiFetch("/points"), apiFetch("/trucks"),
      apiFetch("/routes"), apiFetch("/logs"),
    ]);
    setPoints(normalizePoints(Array.isArray(rP) ? rP : []));
    setTrucks(normalizeTrucks(Array.isArray(rT) ? rT : []));
    setRoutes(normalizeRoutes(Array.isArray(rR) ? rR : []));
    setLogs(normalizeLogs(Array.isArray(rL)     ? rL : []));
  };

  const refreshLogs   = async () => { const r = await apiFetch("/logs");   setLogs(normalizeLogs(Array.isArray(r) ? r : [])); };
  const refreshTrucks = async () => { const r = await apiFetch("/trucks"); setTrucks(normalizeTrucks(Array.isArray(r) ? r : [])); };

  useEffect(() => { if (user) loadAllData(); }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
    setActivePage("dashboard");
    loadAllData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setPoints([]); setTrucks([]); setRoutes([]); setLogs([]); setUsers([]);
    setAppReady(false);
  };

  const handleSetPage = (page) => {
    const allowed = ALLOWED_PAGES[user?.role] || [];
    if (allowed.includes(page)) setActivePage(page);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  if (!appReady) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f7f8fa" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
          <p style={{ color:"#888", fontSize:15 }}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard user={user} points={points} trucks={trucks} routes={routes} logs={logs} />;
      case "points":
        return <PointsPage points={points} setPoints={setPoints} routes={routes} user={user} />;
      case "trucks":
        return <TrucksPage trucks={trucks} setTrucks={setTrucks} user={user} onRefresh={refreshTrucks} />;
      case "routes":
        return (
          <RoutesPage
            routes={routes} setRoutes={setRoutes}
            trucks={trucks} points={points} setPoints={setPoints}
            logs={logs} user={user} users={users}
            onRefresh={refreshAll}
          />
        );
      case "logs":
        return <LogsPage points={points} routes={routes} logs={logs} setLogs={setLogs} onRefresh={refreshLogs} user={user} />;
      case "my-route":
        return (
          <MyRoutePage
            user={user} points={points} routes={routes}
            logs={logs} setLogs={setLogs} trucks={trucks}
            users={users} onRefresh={refreshAll}
          />
        );
      case "users":
        return <UsersPage />;

      case "driver-map":
        return <DriverMapPage routes={routes} points={points} />;

      default:
        return <Dashboard user={user} points={points} trucks={trucks} routes={routes} logs={logs} />;
    }
  };

  return (
    <Layout user={user} activePage={activePage} setActivePage={handleSetPage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}