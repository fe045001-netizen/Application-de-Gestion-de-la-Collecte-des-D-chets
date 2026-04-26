import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterRole, setFilterRole] = useState("tous");
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost/PhpFinalProject/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }

  // Nom affiché : name si dispo, sinon partie avant @ de l'email
  function displayName(u) {
    if (u.name && u.name !== u.email) return u.name;
    return u.email.split("@")[0];
  }

  // Initiale pour l'avatar
  function initial(u) {
    return displayName(u).charAt(0).toUpperCase();
  }

  function openEdit(u) {
    setEditUser({
      ...u,
        name: displayName(u), 
    });
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost/PhpFinalProject/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: editUser.name, email: editUser.email, role: editUser.role })
      });
    } catch (_) {}
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...editUser } : u));
    setEditUser(null);
  }

  async function handleDelete(id) {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost/PhpFinalProject/api/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (_) {}
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteUser(null);
  }

  const roleStyle = {
    admin:       { background: "#EEEDFE", color: "#534AB7" },
    responsable: { background: "#E1F5EE", color: "#0F6E56" },
    chauffeur:   { background: "#E6F1FB", color: "#185FA5" },
  };

  const roleLabels = {
    admin: "Administrateur",
    responsable: "Responsable",
    chauffeur: "Chauffeur",
  };

  const filtered = filterRole === "tous" ? users : users.filter(u => u.role === filterRole);

  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
  };
  const modal = {
    background: "#fff", borderRadius: 16, padding: 32, width: 380,
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)"
  };
  const inputStyle = {
    width: "100%", padding: "10px 13px", border: "1.5px solid #e5e5e5",
    borderRadius: 8, fontSize: 14, outline: "none", background: "#fafafa",
    boxSizing: "border-box", fontFamily: "inherit", marginBottom: 16
  };
  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#666", marginBottom: 5
  };

  return (
    <div>
      <PageHeader title="Utilisateurs" subtitle="Gestion des comptes" />

      {/* Filtres par rôle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["tous", "admin", "responsable", "chauffeur"].map(r => (
          <button key={r} onClick={() => setFilterRole(r)} style={{
            padding: "7px 18px", borderRadius: 20, border: "1.5px solid",
            borderColor: filterRole === r ? "#0F6E56" : "#e5e5e5",
            background: filterRole === r ? "#0F6E56" : "#fff",
            color: filterRole === r ? "#fff" : "#666",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {r === "tous" ? "Tous" : roleLabels[r] || r}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#999", alignSelf: "center" }}>
          {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Chargement…</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["Nom", "Email", "Rôle", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 14 }}>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id} style={{ borderTop: "1px solid #f5f5f5" }}>

                  {/* Nom avec avatar */}
                  <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        background: roleStyle[u.role]?.background || "#eee",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: roleStyle[u.role]?.color || "#444",
                      }}>
                        {initial(u)}
                      </div>
                      {displayName(u)}
                    </div>
                  </td>

                  <td style={{ padding: "14px 20px", color: "#666", fontSize: 14 }}>{u.email}</td>

                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      ...(roleStyle[u.role] || { background: "#eee", color: "#444" }),
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600
                    }}>
                      {roleLabels[u.role] || u.role || "—"}
                    </span>
                  </td>

                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(u)} style={{
                        padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e5e5e5",
                        background: "#fff", color: "#444", fontSize: 12, fontWeight: 600, cursor: "pointer"
                      }}>Modifier</button>
                      <button onClick={() => setDeleteUser(u)} style={{
                        padding: "6px 14px", borderRadius: 8, border: "1.5px solid #fecaca",
                        background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer"
                      }}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Modifier */}
      {editUser && (
        <div style={overlay} onClick={() => setEditUser(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Modifier l'utilisateur</h3>
            <form onSubmit={handleEdit}>

              <label style={labelStyle}>Nom complet</label>
              <input
                style={inputStyle} type="text" required
                placeholder="Entrez le nom"
                value={editUser.name}
                onChange={e => setEditUser(p => ({ ...p, name: e.target.value }))}
              />

              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle} type="email" required
                value={editUser.email}
                onChange={e => setEditUser(p => ({ ...p, email: e.target.value }))}
              />

              <label style={labelStyle}>Rôle</label>
              <select
                value={editUser.role}
                onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyle, marginBottom: 24 }}
              >
                <option value="chauffeur">Chauffeur</option>
                <option value="responsable">Responsable</option>
                <option value="admin">Administrateur</option>
              </select>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setEditUser(null)} style={{
                  flex: 1, padding: 11, borderRadius: 8, border: "1.5px solid #e5e5e5",
                  background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
                }}>Annuler</button>
                <button type="submit" style={{
                  flex: 1, padding: 11, borderRadius: 8, border: "none",
                  background: "#0F6E56", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
                }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {deleteUser && (
        <div style={overlay} onClick={() => setDeleteUser(null)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700 }}>Supprimer l'utilisateur</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
              Voulez-vous vraiment supprimer <strong>{displayName(deleteUser)}</strong> ? Cette action est irréversible.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteUser(null)} style={{
                flex: 1, padding: 11, borderRadius: 8, border: "1.5px solid #e5e5e5",
                background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
              }}>Annuler</button>
              <button onClick={() => handleDelete(deleteUser.id)} style={{
                flex: 1, padding: 11, borderRadius: 8, border: "none",
                background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}