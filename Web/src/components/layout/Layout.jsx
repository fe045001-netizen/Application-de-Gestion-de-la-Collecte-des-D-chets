import logo from "../../assets/Logo.png";
const NAV = {
  admin: [
    { id:"dashboard", label:"Tableau de bord"    },
    { id:"points",    label:"Points de collecte" },
    { id:"trucks",    label:"Camions"             },
    { id:"routes",    label:"Tournées"            },
    { id:"logs",      label:"Suivi opérationnel" },
    { id:"users",     label:"Utilisateurs"        },
    { id:"driver-map", label:"Carte chauffeurs"  },  
  ],
  responsable: [
    { id:"dashboard",  label:"Tableau de bord"   },
    { id:"points",     label:"Points de collecte"},
    { id:"routes",     label:"Tournées"           },
    { id:"logs",       label:"Suivi opérationnel"},
    { id:"driver-map", label:"Carte chauffeurs"  },  
  ],
  chauffeur: [
    { id:"dashboard", label:"Tableau de bord" },
    { id:"my-route",  label:"Ma tournée"      },
  ],
};

const ROLE_BADGE = {
  admin:       { label:"Administrateur", color:"#7C3AED", bg:"#f3f0ff" },
  responsable: { label:"Responsable",    color:"#0F6E56", bg:"#e6f7f2" },
  chauffeur:   { label:"Chauffeur",      color:"#D97706", bg:"#fffbeb" },
};

export default function Layout({ user, activePage, setActivePage, onLogout, children }) {
  const navItems = NAV[user?.role] || [];
  const badge    = ROLE_BADGE[user?.role] || { label: user?.role, color:"#666", bg:"#f5f5f5" };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#f7f8fa" }}>

      <aside style={{
        width:230, flexShrink:0, background:"#fff",
        borderRight:"1px solid #efefef",
        display:"flex", flexDirection:"column",
      }}>

        {/* Logo */}
        <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid #f0f0f0" }}>
          {/* Logo */}
<div style={{ padding: "20px 20px 16px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    
    <img 
      src={logo} 
      alt="CleanUp Logo"
      style={{ 
        width: 76, 
        height: 76, 
        borderRadius: 10, 
        objectFit: "cover" 
      }} 
    />

  
  </div>
</div>

          <div style={{ background:badge.bg, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:11, color:"#bbb", marginBottom:3 }}>Connecté en tant que</div>
            <div style={{ fontSize:13, fontWeight:700, color:badge.color, marginBottom:1 }}>{user?.name}</div>
            <div style={{ fontSize:11, color:badge.color, opacity:0.7 }}>{badge.label}</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:"10px 10px", overflowY:"auto" }}>
          {navItems.map(item => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  width:"100%", textAlign:"left",
                  padding:"10px 12px", borderRadius:10,
                  border:"none", cursor:"pointer",
                 
                  marginBottom:3, fontSize:13,
                  background: active ? "#edfaf5"  : "transparent",
                  color:      active ? "#0F6E56"  : "#555",
                  fontWeight: active ? 700        : 400,
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize:15, width:20, textAlign:"center" }}>{item.icon}</span>
                {item.label}
                {active && (
                  <span style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"#0F6E56", flexShrink:0 }} />
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding:"10px 10px 16px", borderTop:"1px solid #f0f0f0" }}>
          <button
            onClick={onLogout}
            style={{ width:"100%", padding:"10px 13px", borderRadius:10, border:"none", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, background:"#fff5f5", color:"#dc2626", fontSize:13, fontWeight:500 }}
          >
            <span></span> Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        {children}
      </main>
    </div>
  );
}