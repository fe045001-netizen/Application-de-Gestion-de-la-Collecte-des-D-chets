import { useState } from "react";
import logo from "../assets/Logo.png";
import { MOCK_USERS } from "../data/mockData"; 



const ROLE_BADGE = {
  admin:       { label:"Administrateur", color:"#7C3AED", bg:"#f3f0ff", desc:"Accès complet à toutes les fonctionnalités" },
  responsable: { label:"Responsable",    color:"#0F6E56", bg:"#e6f7f2", desc:"Gestion des points, tournées et suivi"      },
  chauffeur:   { label:"Chauffeur",      color:"#D97706", bg:"#fffbeb", desc:"Tournée en cours et marquage des points"    },
};

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState("login"); 

  const [registerName,     setRegisterName]     = useState("");
  const [registerEmail,    setRegisterEmail]    = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole,     setRegisterRole]     = useState("chauffeur");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); 
    setLoading(true);

    if (mode === "register") {
      try {
        const res = await fetch("http://localhost/PhpFinalProject/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: registerName,
            email: registerEmail,
            password: registerPassword,
            role: registerRole
          }),
        });
        const data = await res.json();
        
        if (res.ok && data.token && data.user) {
          localStorage.setItem("token", data.token);
          onLogin(data.user, data.token);
          setLoading(false);
          return;
        } else {
          throw new Error(data.error || "Erreur lors de l'inscription");
        }
      } catch (err) {
        const newUser = {
          id: MOCK_USERS.length + 1,
          email: registerEmail,
          password: registerPassword,
          role: registerRole,
          name: registerName
        };
        MOCK_USERS.push(newUser);
        const token = btoa(JSON.stringify({ id: newUser.id, role: newUser.role, ts: Date.now() }));
        localStorage.setItem("token", token);
        onLogin(newUser, token);
        setLoading(false);
        return;
      }
    }

    try {
      const res  = await fetch("http://localhost/PhpFinalProject/api/login", {
        method:"POST", 
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem("token", data.token);
        onLogin(data.user, data.token);
        setLoading(false); 
        return;
      }
    } catch (_) { 
      // API indisponible → fallback mock
    }

    // Fallback mockData (dev)
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const tok = btoa(JSON.stringify({ id:found.id, role:found.role, ts:Date.now() }));
      localStorage.setItem("token", tok);
      onLogin(found, tok);
    } else {
      setError("Email ou mot de passe incorrect.");
    }
    setLoading(false);
  }

  const QUICK = [
    { label:"Admin",       email:"admin@collecte.ma",       pwd:"admin123",     role:"admin"       },
    { label:"Responsable", email:"responsable@collecte.ma", pwd:"resp123",      role:"responsable" },
    { label:"Chauffeur",   email:"chauffeur@collecte.ma",   pwd:"chauffeur123", role:"chauffeur"   },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#f7f8fa", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* Panneau gauche – branding */}
<div style={{ 
  flex:1, 
  background:"linear-gradient(135deg,#0F6E56,#1D9E75)", 
  display:"flex", 
  flexDirection:"column", 
  alignItems:"center", 
  justifyContent:"center", 
  padding:40, 
  color:"#fff" 
}}>

  {/* Logo */}
  <img 
    src={logo} 
    alt="CleanUp Logo"
    style={{ 
      width: 160, 
      height: 160, 
      objectFit: "cover", 
      marginBottom: 20 
    }} 
  />

  {/* Titre */}
  <h1 style={{ fontSize:28, fontWeight:800, margin:"0 0 8px" }}>
    CleanUp
  </h1>

  {/* Phrase */}
  <p style={{ 
    fontSize:14, 
    opacity:0.85, 
    margin:"0 0 40px", 
    textAlign:"center" 
  }}>
    Pour un monde propre
  </p>

</div>

      {/* Panneau droit – formulaire */}
      <div style={{ width:440, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 6px", color:"#111" }}>
            {mode === "login" ? "Connexion" : "Inscription"}
          </h2>
          <p style={{ fontSize:13, color:"#aaa", margin:"0 0 28px" }}>
            {mode === "login" 
              ? "Entrez vos identifiants pour accéder au tableau de bord" 
              : "Créez un nouveau compte pour accéder à la plateforme"}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>Nom complet</label>
                  <input 
                    type="text" 
                    value={registerName} 
                    onChange={e=>setRegisterName(e.target.value)} 
                    required 
                    placeholder="Votre nom"
                    style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#fafafa" }} 
                  />
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>Rôle</label>
                  <select 
                    value={registerRole} 
                    onChange={e=>setRegisterRole(e.target.value)}
                    style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontSize:14, outline:"none", background:"#fafafa" }}
                  >
                    <option value="chauffeur">Chauffeur</option>
                    <option value="responsable">Responsable</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>Email</label>
              <input 
                type="email" 
                value={mode === "login" ? email : registerEmail} 
                onChange={e => mode === "login" ? setEmail(e.target.value) : setRegisterEmail(e.target.value)} 
                required 
                placeholder="votre@email.ma"
                style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#fafafa" }} 
              />
            </div>

            <div style={{ marginBottom:22 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>Mot de passe</label>
              <input 
                type="password" 
                value={mode === "login" ? password : registerPassword} 
                onChange={e => mode === "login" ? setPassword(e.target.value) : setRegisterPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#fafafa" }} 
              />
            </div>

            {error && (
              <div style={{ background:"#fef2f2", color:"#dc2626", padding:"10px 14px", borderRadius:10, fontSize:13, marginBottom:16, border:"1px solid #fecaca" }}>
                 {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", background: loading?"#94a3b8":"#0F6E56", color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
              {loading 
                ? (mode === "login" ? "Connexion en cours…" : "Inscription en cours…") 
                : (mode === "login" ? "Se connecter →" : "S'inscrire →")}
            </button>

            <div style={{ textAlign:"center", marginTop:16 }}>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
                style={{ background:"none", border:"none", color:"#0F6E56", cursor:"pointer", fontWeight:600 }}
              >
                {mode === "login" ? "Créer un compte" : "Déjà un compte ? Se connecter"}
              </button>
            </div>
          </form>

          {/* Accès rapide - seulement en mode login */}
          
        </div>
      </div>
    </div>
  );
}