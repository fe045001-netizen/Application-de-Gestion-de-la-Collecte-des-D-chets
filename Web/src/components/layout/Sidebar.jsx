import { NAV_ITEMS, ROLE_COLORS } from "../../utils/constants";
import logo from "../../assets/Logo.png";
export default function Sidebar({ user, activePage, setActivePage, onLogout }) {
  const navItems  = NAV_ITEMS[user?.role] || NAV_ITEMS.chauffeur;
  const roleColor = ROLE_COLORS[user?.role] || "#666";

  return (
    <div style={{ width: 240, background: "#fff", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
    {/* Logo */}
<div style={{ padding: "20px 20px 16px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    
    <img 
      src={logo} 
      alt="CleanUp Logo"
      style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        objectFit: "cover" 
      }} 
    />

   

  </div>
</div>
      <nav style={{ padding: "0 12px", flex: 1 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: activePage === item.id ? "#f0faf7" : "transparent", color: activePage === item.id ? "#0F6E56" : "#555", fontWeight: activePage === item.id ? 600 : 400, fontSize: 14, cursor: "pointer", marginBottom: 2, textAlign: "left", fontFamily: "inherit" }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: 16, borderTop: "1px solid #eee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: roleColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: roleColor }}>
            {user?.name?.charAt(0) || "?"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{user?.name || "Utilisateur"}</div>
            <div style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px 0", border: "1px solid #eee", borderRadius: 8, background: "#fff", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}