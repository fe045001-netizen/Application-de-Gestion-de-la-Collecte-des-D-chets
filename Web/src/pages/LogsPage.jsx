import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Btn from "../components/ui/Btn";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";

const API_URL = "http://localhost/PhpFinalProject/api/logs";

// Helper : appel API sécurisé qui retourne toujours { ok, data, error }
async function apiCall(url, options = {}) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const rawText = await res.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch { return { ok: false, error: `Réponse non-JSON (${res.status}) : ${rawText.substring(0, 100)}` }; }
    if (!res.ok) return { ok: false, error: data.error || `Erreur ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: "Serveur inaccessible : " + err.message };
  }
}

export default function LogsPage({ points, routes }) {
  const [logs, setLogs]           = useState([]);
  const [filter, setFilter]       = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ status: "", note: "" });
  const [apiError, setApiError]   = useState("");
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [form, setForm] = useState({ pointId: "", routeId: "", status: "collecté", note: "" });

  // ── 1. Charger les logs depuis l'API au montage ──────────────────────────
  useEffect(() => {
    const loadLogs = async () => {
      setFetching(true);
      const { ok, data, error } = await apiCall(API_URL);
      if (ok) {
        // Normaliser les clés snake_case → camelCase
        const normalized = data.map(l => ({
          id:        l.id,
          pointId:   l.point_id   ?? l.pointId,
          routeId:   l.route_id   ?? l.routeId,
          status:    l.status,
          note:      l.note || "",
          timestamp: l.timestamp,
        }));
        setLogs(normalized);
      } else {
        setApiError("Impossible de charger les logs : " + error);
      }
      setFetching(false);
    };
    loadLogs();
  }, []);

  const filtered = logs.filter(l => filter === "all" || l.status === filter);

  // ── 2. Ajouter un log (POST) ─────────────────────────────────────────────
  const save = async () => {
    if (!form.pointId || !form.routeId) {
      setApiError("Veuillez choisir un point et une tournée.");
      return;
    }
    setLoading(true);
    setApiError("");

    const { ok, data, error } = await apiCall(API_URL, {
      method: "POST",
      body: JSON.stringify({
        point_id: parseInt(form.pointId),
        route_id: parseInt(form.routeId),
        status:   form.status,
        note:     form.note,
      }),
    });

    if (!ok) {
      setApiError(error);
      setLoading(false);
      return;
    }

    // Ajouter en local avec l'id retourné par la DB
    setLogs(ls => [...ls, {
      id:        data.id,
      pointId:   parseInt(form.pointId),
      routeId:   parseInt(form.routeId),
      status:    form.status,
      note:      form.note,
      timestamp: new Date().toISOString(),
    }]);

    setForm({ pointId: "", routeId: "", status: "collecté", note: "" });
    setShowModal(false);
    setLoading(false);
  };

  // ── 3. Ouvrir l'édition d'un log ─────────────────────────────────────────
  const startEdit = (log) => {
    setEditingId(log.id);
    setEditForm({ status: log.status, note: log.note || "" });
    setSaveError("");
  };

  // ── 4. Sauvegarder la modification (PUT) ─────────────────────────────────
  const saveEdit = async (logId) => {
    setSaveError("");

    const { ok, error } = await apiCall(`${API_URL}/${logId}`, {
      method: "PUT",
      body: JSON.stringify({
        status: editForm.status,
        note:   editForm.note,
      }),
    });

    if (!ok) {
      setSaveError(error);
      return;
    }

    // Mettre à jour l'état local
    setLogs(prev => prev.map(l =>
      l.id === logId ? { ...l, status: editForm.status, note: editForm.note } : l
    ));
    setEditingId(null);
  };

  // ── Résumé par zone ───────────────────────────────────────────────────────
  const getZoneSummary = () => {
    const zones = {};
    points.forEach(p => {
      if (!zones[p.zone]) zones[p.zone] = { total: 0, collected: 0 };
      zones[p.zone].total++;
      if (logs.find(l => l.pointId == p.id && l.status === "collecté")) zones[p.zone].collected++;
    });
    return zones;
  };
  const zones = getZoneSummary();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Suivi opérationnel"
        subtitle="Historique des collectes et incidents"
        action={<Btn onClick={() => { setShowModal(true); setApiError(""); }}>+ Ajouter une collecte</Btn>}
      />

      {apiError && !showModal && (
        <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 16px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
           {apiError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

        {/* ── Liste des logs ── */}
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["all","Tous"],["collecté","Collectés"],["non_collecté","Non collectés"],["problème","Incidents"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding: "7px 16px", borderRadius: 20, border: "1px solid",
                borderColor: filter===v ? "#0F6E56" : "#eee",
                background:  filter===v ? "#f0faf7" : "#fff",
                color:       filter===v ? "#0F6E56" : "#666",
                fontSize: 13, fontWeight: filter===v ? 600 : 400, cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden" }}>
            {fetching && (
              <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Chargement...</div>
            )}
            {!fetching && filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Aucun enregistrement</div>
            )}

            {!fetching && filtered.map(log => {
              const point     = points.find(p => p.id == log.pointId);
              const route     = routes.find(r => r.id == log.routeId);
              const isEditing = editingId === log.id;

              return (
                <div key={log.id} style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  padding: "12px 16px", borderBottom: "1px solid #f2f2f2", alignItems: "flex-start",
                }}>
                  {/* Infos */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{point?.name || `Point #${log.pointId}`}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {route?.name || `Tournée #${log.routeId}`} • {new Date(log.timestamp).toLocaleString("fr-MA")}
                    </div>
                    {log.note && (
                      <div style={{ fontSize: 12, marginTop: 6, padding: "4px 8px", background: "#fff5f5", borderRadius: 6 }}>
                         {log.note}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ minWidth: 150 }}>
                    {!isEditing ? (
                      <>
                        <Badge status={log.status} />
                        <button
                          onClick={() => startEdit(log)}
                          style={{ display: "block", marginTop: 6, fontSize: 12, padding: "4px 8px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}
                        >
                          Modifier
                        </button>
                      </>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                          style={{ padding: 6, borderRadius: 8, border: "1px solid #ddd", fontSize: 12 }}
                        >
                          <option value="collecté">Collecté</option>
                          <option value="non_collecté">Non collecté</option>
                          <option value="problème">Problème</option>
                        </select>

                        <textarea
                          value={editForm.note}
                          onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                          placeholder="Ajouter note..."
                          style={{ fontSize: 12, padding: 6, borderRadius: 8, border: "1px solid #ddd", height: 50, resize: "vertical" }}
                        />

                        {saveError && (
                          <div style={{ fontSize: 11, color: "#A32D2D", background: "#FCEBEB", padding: "4px 8px", borderRadius: 6 }}>
                             {saveError}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => saveEdit(log.id)}
                            style={{ flex: 1, fontSize: 12, padding: "4px 8px", background: "#1D9E75", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ fontSize: 12, padding: "4px 8px", background: "#eee", color: "#555", border: "none", borderRadius: 6, cursor: "pointer" }}
                          >
                            annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Résumé par zone ── */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eee", height: "fit-content" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Résumé par zone</h3>
          {Object.entries(zones).map(([zone, data]) => {
            const pct = Math.round((data.collected / data.total) * 100);
            return (
              <div key={zone} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{zone}</span>
                  <span style={{ color: "#888" }}>{data.collected}/{data.total}</span>
                </div>
                <div style={{ background: "#f5f5f5", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: pct>=80 ? "#1D9E75" : pct>=50 ? "#378ADD" : "#E24B4A" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal ajout ── */}
      {showModal && (
        <Modal title="Enregistrer une collecte" onClose={() => { setShowModal(false); setApiError(""); }}>
          <Select label="Point de collecte" value={form.pointId} onChange={e => setForm({...form, pointId: e.target.value})}>
            <option value="">— Choisir un point —</option>
            {points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Tournée" value={form.routeId} onChange={e => setForm({...form, routeId: e.target.value})}>
            <option value="">— Choisir une tournée —</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select label="Statut" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="collecté">Collecté</option>
            <option value="non_collecté">Non collecté</option>
            <option value="problème">Problème</option>
          </Select>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 }}>Note (optionnel)</label>
            <textarea
              value={form.note} onChange={e => setForm({...form, note: e.target.value})}
              placeholder="ex: Bac plein, accès bloqué..."
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 80 }}
            />
          </div>

          {apiError && (
            <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
              ⚠️ {apiError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" onClick={() => { setShowModal(false); setApiError(""); }}>Annuler</Btn>
            <Btn onClick={save} style={{ opacity: loading?0.6:1, pointerEvents: loading?"none":"auto" }}>
              {loading ? "Envoi..." : "Enregistrer"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}