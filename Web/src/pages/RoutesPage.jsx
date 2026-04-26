import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import Btn from "../components/ui/Btn";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const API = "http://localhost/PhpFinalProject/api";

async function api(path, method = "GET", body = null) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { return { ok:false, error:"Réponse invalide" }; }
    return { ok:res.ok, data, error:res.ok ? null : (data?.error || `Erreur ${res.status}`) };
  } catch(e) { return { ok:false, error:"Réseau: "+e.message }; }
}

const STATUS_CFG = {
  planifiée: { bg:"#fef3c7", color:"#92400e", dot:"#d97706", label:"Planifiée" },
  en_cours:  { bg:"#d1fae5", color:"#065f46", dot:"#059669", label:"En cours"  },
  terminée:  { bg:"#f3f4f6", color:"#374151", dot:"#9ca3af", label:"Terminée"  },
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || { bg:"#f3f4f6", color:"#374151", dot:"#9ca3af", label:status };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700,
      padding:"3px 10px", borderRadius:20, background:s.bg, color:s.color }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot }} />{s.label}
    </span>
  );
}

export default function RoutesPage({ routes, setRoutes, trucks, points, setPoints, logs, user, users = [], onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name:"", truckId:"", driverId:"", date:"", status:"planifiée", selectedPoints:[],
  });

  const canEdit = user.role === "admin" || user.role === "responsable";

  // Chauffeurs uniquement
  const chauffeurs = users.filter(u => u.role === "chauffeur");

  // Stats d'une tournée
  function stats(r) {
    const rPts    = points.filter(p => parseInt(p.routeId) === parseInt(r.id));
    const rLogs   = logs.filter(l => parseInt(l.routeId)   === parseInt(r.id));
    const done    = rLogs.filter(l => l.status === "collecté").length;
    const probs   = rLogs.filter(l => l.status === "problème").length;
    const pct     = rPts.length ? Math.round(done / rPts.length * 100) : 0;
    const truck   = trucks.find(t => parseInt(t.id) === parseInt(r.truckId));

    const chauffeur = users.find(u => parseInt(u.id) === parseInt(r.driverId));
    return { rPts, done, probs, pct, truck, chauffeur };
  }

  function openNew() {
    setEditing(null);
    setForm({ name:"", truckId:"", driverId:"", date:new Date().toISOString().split("T")[0], status:"planifiée", selectedPoints:[] });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(r) {
    setEditing(r.id);
    const currentPts = points.filter(p => parseInt(p.routeId) === parseInt(r.id)).map(p => p.id);
    setForm({
      name:    r.name    || "",
      truckId: r.truckId  ? String(r.truckId)  : "",
      driverId:r.driverId ? String(r.driverId) : "",
      date:    r.date    || "",
      status:  r.status  || "planifiée",
      selectedPoints: currentPts,
    });
    setFormError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim() || !form.date) { setFormError("Nom et date requis."); return; }
    setSaving(true); setFormError("");

    const path   = editing ? `/routes/${editing}` : "/routes";
    const method = editing ? "PUT" : "POST";

    const { ok, data, error } = await api(path, method, {
      name:      form.name.trim(),
      date:      form.date,
      status:    form.status,
      truck_id:  form.truckId  ? parseInt(form.truckId)  : null,
      driver_id: form.driverId ? parseInt(form.driverId) : null, 
    });

    setSaving(false);
    if (!ok) { setFormError(error || "Erreur serveur"); return; }

    const routeId = editing ? parseInt(editing) : (data?.id || null);

    // Assigner / désassigner les points
    if (routeId) {
      const prev     = points.filter(p => parseInt(p.routeId) === routeId).map(p => p.id);
      const toAdd    = form.selectedPoints.filter(id => !prev.includes(id));
      const toRemove = prev.filter(id => !form.selectedPoints.includes(id));
      await Promise.all([
        ...toAdd.map(id    => api(`/points/${id}`, "PUT", { route_id: routeId })),
        ...toRemove.map(id => api(`/points/${id}`, "PUT", { route_id: null })),
      ]);
    }

    await onRefresh();
    setShowModal(false);
    setSelected(null);
  }

  async function deleteRoute(id) {
    if (!window.confirm("Supprimer cette tournée ?")) return;
    const pts = points.filter(p => parseInt(p.routeId) === parseInt(id));
    await Promise.all(pts.map(p => api(`/points/${p.id}`, "PUT", { route_id: null })));
    const { ok, error } = await api(`/routes/${id}`, "DELETE");
    if (!ok) { alert("Erreur: " + error); return; }
    await onRefresh();
    if (selected?.id === id) setSelected(null);
  }

  const availablePoints = points.filter(p =>
    !p.routeId || parseInt(p.routeId) === parseInt(editing || 0)
  );

  return (
    <div>
      <PageHeader
        title="Tournées de collecte"
        subtitle={`${routes.length} tournée${routes.length !== 1 ? "s" : ""}`}
        action={canEdit && <Btn onClick={openNew}>+ Nouvelle tournée</Btn>}
      />

      <div style={{ display:"grid", gridTemplateColumns:selected ? "1fr 380px" : "1fr", gap:16 }}>

        {/* ── Liste ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {routes.length === 0 && (
            <div style={{ padding:48, textAlign:"center", color:"#aaa", background:"#fff", borderRadius:16, border:"1px solid #eee" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🗺️</div>
              <p>Aucune tournée — cliquez sur "+ Nouvelle tournée".</p>
            </div>
          )}

          {[...routes].sort((a,b) => {
            const o = { en_cours:0, planifiée:1, terminée:2 };
            return (o[a.status]??9)-(o[b.status]??9) || new Date(b.date)-new Date(a.date);
          }).map(r => {
            const { rPts, done, probs, pct, truck, chauffeur } = stats(r);
            const barColor   = pct===100 ? "#059669" : pct>=50 ? "#3b82f6" : "#ef4444";
            const truckLabel = truck ? `${truck.model} • ${truck.plate}` : r.truckName || "Aucun camion";
            const isSelected = selected?.id === r.id;

            return (
              <div key={r.id} onClick={() => setSelected(isSelected ? null : r)}
                style={{ background:"#fff", borderRadius:16,
                  border: isSelected ? "2px solid #059669" : "1px solid #eee",
                  cursor:"pointer", overflow:"hidden", transition:"border-color 0.2s" }}>

                {/* Header */}
                <div style={{ padding:"12px 18px", background:STATUS_CFG[r.status]?.bg||"#f3f4f6",
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{r.name}</div>
                    <div style={{ fontSize:12, color:"#777" }}>
                       {r.date ? new Date(r.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"}) : "—"}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div style={{ padding:"12px 18px" }}>
                  <div style={{ display:"flex", gap:16, fontSize:13, color:"#555", marginBottom:10, flexWrap:"wrap" }}>
                    <span> {truckLabel}</span>
                    <span> {chauffeur ? chauffeur.name : "Aucun chauffeur"}</span>
                    <span>{rPts.length} point{rPts.length!==1?"s":""}</span>
                    {probs > 0 && <span style={{ color:"#dc2626" }}> {probs} incident{probs>1?"s":""}</span>}
                  </div>

                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#888", marginBottom:4 }}>
                      <span>{done}/{rPts.length} collectés</span>
                      <span style={{ fontWeight:700, color:barColor }}>{pct}%</span>
                    </div>
                    <div style={{ background:"#f0f0f0", borderRadius:8, height:6, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:barColor, borderRadius:8, transition:"width 0.4s" }} />
                    </div>
                  </div>

                  {canEdit && (
                    <div style={{ display:"flex", gap:8 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(r)}
                        style={{ flex:1, padding:"7px 10px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                         Éditer
                      </button>
                      <button onClick={() => deleteRoute(r.id)}
                        style={{ padding:"7px 12px", borderRadius:8, border:"1px solid #fee2e2", background:"#fff1f2", cursor:"pointer", fontSize:12, color:"#dc2626" }}>
                        Supprimer 
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Détail ── */}
        {selected && (() => {
          const { rPts, done, pct, truck, chauffeur } = stats(selected);
          const barColor = pct===100 ? "#059669" : pct>=50 ? "#3b82f6" : "#ef4444";
          return (
            <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid #eee", height:"fit-content", position:"sticky", top:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div>
                  <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>{selected.name}</h3>
                  <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>
                    {truck ? ` ${truck.model} ${truck.plate}` : "Aucun camion"}
                    {chauffeur && ` —  ${chauffeur.name}`}
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:22 }}>supprimer</button>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                  <span style={{ color:"#888" }}>{done}/{rPts.length} collectés</span>
                  <span style={{ fontWeight:700, color:barColor }}>{pct}%</span>
                </div>
                <div style={{ background:"#f0f0f0", borderRadius:8, height:8, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:barColor, borderRadius:8 }} />
                </div>
              </div>

              {rPts.length === 0 ? (
                <div style={{ textAlign:"center", padding:"20px 0", color:"#bbb" }}>
                  <p style={{ fontSize:13 }}>Aucun point — cliquez  Éditer pour en assigner.</p>
                </div>
              ) : rPts.map(p => {
                const log = logs.find(l => parseInt(l.pointId)===parseInt(p.id) && parseInt(l.routeId)===parseInt(selected.id));
                const DOT = { collecté:"#059669", non_collecté:"#d97706", problème:"#dc2626" };
                const dot = log ? DOT[log.status]||"#aaa" : "#d1d5db";
                return (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #f5f5f5" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                      <div style={{ fontSize:11, color:"#aaa" }}>{[p.zone,p.type].filter(Boolean).join(" • ")}</div>
                      {log?.note && <div style={{ fontSize:11, color:"#dc2626" }}> {log.note}</div>}
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:12, background:dot+"22", color:dot }}>
                      {log ? log.status.replace("_"," ") : "En attente"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <Modal title={editing ? "Modifier la tournée" : "Nouvelle tournée"} onClose={() => setShowModal(false)}>
          <Input label="Nom de la tournée" value={form.name}
            onChange={e => setForm({...form, name:e.target.value})}
            placeholder="ex: Tournée Guéliz-Médina" />

          <Input label="Date" type="date" value={form.date}
            onChange={e => setForm({...form, date:e.target.value})} />

          {/* Camion */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>
               Camion
            </label>
            <select value={form.truckId} onChange={e => setForm({...form, truckId:e.target.value})}
              style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e0e0e0", borderRadius:10, fontSize:14, outline:"none", background:"#fff", boxSizing:"border-box" }}>
              <option value="">— Sans camion —</option>
              {trucks.map(t => (
                <option key={t.id} value={String(t.id)}>{t.model} • {t.plate} ({t.status})</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>
              Chauffeur assigné
              <span style={{ color:"#aaa", fontWeight:400, fontSize:12, marginLeft:8 }}>
                ({chauffeurs.length} chauffeur{chauffeurs.length!==1?"s":""})
              </span>
            </label>
            <select value={form.driverId} onChange={e => setForm({...form, driverId:e.target.value})}
              style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e0e0e0", borderRadius:10, fontSize:14, outline:"none", background:"#fff", boxSizing:"border-box" }}>
              <option value="">— Sans chauffeur —</option>
              {chauffeurs.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name} ({c.email})</option>
              ))}
            </select>
            {form.driverId && (
              <div style={{ marginTop:8, padding:"8px 12px", background:"#f0faf7", borderRadius:8, fontSize:13, color:"#0F6E56" }}>
                 Tournée assignée à <strong>{chauffeurs.find(c => String(c.id) === form.driverId)?.name}</strong>
                {" — "}cette tournée apparaîtra dans son interface.
              </div>
            )}
          </div>

          <Select label="Statut" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
            <option value="planifiée">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminée">Terminée</option>
          </Select>

          {/* Points */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:8 }}>
              Points de collecte ({form.selectedPoints.length} sélectionné{form.selectedPoints.length!==1?"s":""})
            </label>
            {availablePoints.length === 0 ? (
              <div style={{ padding:12, background:"#f9fafb", borderRadius:10, color:"#aaa", fontSize:13 }}>
                Aucun point disponible.
              </div>
            ) : (
              <div style={{ maxHeight:200, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                {availablePoints.map(p => {
                  const checked = form.selectedPoints.includes(p.id);
                  return (
                    <label key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                      borderRadius:10, border:`1.5px solid ${checked?"#059669":"#e5e7eb"}`,
                      background:checked?"#ecfdf5":"#fff", cursor:"pointer" }}>
                      <input type="checkbox" checked={checked}
                        onChange={() => setForm(f => ({
                          ...f,
                          selectedPoints: f.selectedPoints.includes(p.id)
                            ? f.selectedPoints.filter(i => i !== p.id)
                            : [...f.selectedPoints, p.id]
                        }))}
                        style={{ width:15, height:15, accentColor:"#059669" }} />
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:"#888" }}>{[p.zone,p.type].filter(Boolean).join(" • ")}</div>
                      </div>
                      {checked && <span style={{ marginLeft:"auto", fontSize:11, color:"#059669", fontWeight:700 }}>✓</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {formError && (
            <div style={{ background:"#fef2f2", color:"#dc2626", padding:"10px 14px", borderRadius:10, fontSize:13, marginBottom:12 }}>
               {formError}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Annuler</Btn>
            <Btn onClick={save} style={{ opacity:saving?0.6:1, pointerEvents:saving?"none":"auto" }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}