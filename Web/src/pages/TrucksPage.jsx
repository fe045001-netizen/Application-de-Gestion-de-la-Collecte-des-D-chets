import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Btn from "../components/ui/Btn";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { can } from "../utils/constants";

const API_URL = "http://localhost/PhpFinalProject/api/trucks";

async function apiCall(url, method, body) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    console.log(`[Trucks] ${method} ${url} →`, res.status, text.substring(0, 200));
    try { return { ok: res.ok, data: JSON.parse(text) }; }
    catch { return { ok: false, data: { error: text } }; }
  } catch (err) {
    return { ok: false, data: { error: err.message } };
  }
}

export default function TrucksPage({ trucks, setTrucks, user, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [error,     setError]     = useState("");
  const [saving,    setSaving]    = useState(false);
const [form, setForm] = useState({
  name: "",
  truckId: "",
  driverId: "",  
  date: "",
  status: "planifiée"
});
  const canCreate = can(user, "trucks", "create");
  const canEdit   = can(user, "trucks", "edit");
  const canDelete = can(user, "trucks", "delete");

  const openNew  = () => {
    setEditing(null);
    setForm({ plate: "", model: "", capacity: "", status: "actif" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t.id);
    setForm({ plate: t.plate || "", model: t.model || "", capacity: String(t.capacity || ""), status: t.status || "actif" });
    setError("");
    setShowModal(true);
  };

  const save = async () => {
    if (!form.plate || !form.model) { setError("Plaque et modèle requis."); return; }
    setSaving(true);
    setError("");

    const url    = editing ? `${API_URL}/${editing}` : API_URL;
    const method = editing ? "PUT" : "POST";

    // Envoyer les deux variantes de noms de colonnes pour compatibilité
    const body = {
      plate:        form.plate,
      plate_number: form.plate,   // au cas où la DB utilise plate_number
      model:        form.model,
      name:         form.model,   // au cas où la DB utilise name
      capacity:     parseInt(form.capacity) || 0,
      status:       form.status,
    };

    const { ok, data } = await apiCall(url, method, body);
    setSaving(false);

    if (!ok) { setError(data?.error || "Erreur serveur"); return; }

    // Recharger depuis la DB pour avoir les vraies données
    if (typeof onRefresh === "function") {
      await onRefresh();
    } else {
      if (editing) {
        setTrucks(ts => ts.map(t => t.id === editing
          ? { ...t, plate: form.plate, model: form.model, capacity: parseInt(form.capacity) || 0, status: form.status }
          : t
        ));
      } else {
        setTrucks(ts => [...ts, { id: data.id, plate: form.plate, model: form.model, capacity: parseInt(form.capacity) || 0, status: form.status, driverId: null }]);
      }
    }

    setShowModal(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer ce camion ?")) return;
    const { ok, data } = await apiCall(`${API_URL}/${id}`, "DELETE", null);
    if (!ok) { alert(data?.error || "Erreur suppression"); return; }
    if (typeof onRefresh === "function") await onRefresh();
    else setTrucks(ts => ts.filter(t => t.id !== id));
  };

  const statusLabel = { actif: "Actif", maintenance: "Maintenance", hors_service: "Hors service" };

  return (
    <div>
      <PageHeader
        title="Gestion des camions"
        subtitle={`${trucks.length} camion${trucks.length !== 1 ? "s" : ""}`}
        action={canCreate && <Btn onClick={openNew}>+ Nouveau camion</Btn>}
      />

      {!canCreate && (
        <div style={{ background: "#E6F1FB", color: "#185FA5", padding: "10px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20 }}>
          👁️ Mode lecture seule
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {trucks.map(t => (
          <div key={t.id} style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #eee" }}>
            
            {/* Plaque */}
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2, color: t.plate ? "#1a1a1a" : "#ccc" }}>
              {t.plate || "— plaque —"}
            </div>
            {/* Modèle */}
            <div style={{ fontSize: 13, color: t.model ? "#666" : "#ccc", marginBottom: 14 }}>
              {t.model || "— modèle —"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: canEdit ? 14 : 0 }}>
              <div style={{ background: "#f7f8fa", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#888" }}>Capacité</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{t.capacity || 0}t</div>
              </div>
              <div style={{ background: "#f7f8fa", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11, color: "#888" }}>Chauffeur</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.driverId ? "Assigné" : "Libre"}</div>
              </div>
            </div>
            {canEdit && (
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="secondary" onClick={() => openEdit(t)} style={{ flex: 1, padding: "7px 0", fontSize: 13 }}>Éditer</Btn>
                {canDelete && <Btn variant="danger" onClick={() => remove(t.id)} style={{ padding: "7px 14px", fontSize: 13 }}>Supprimer</Btn>}
              </div>
            )}
          </div>
        ))}
        {trucks.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: "#aaa" }}>Aucun camion</div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Modifier le camion" : "Nouveau camion"} onClose={() => setShowModal(false)}>
          <Input label="Plaque d'immatriculation" value={form.plate}    onChange={e => setForm({ ...form, plate: e.target.value })}    placeholder="ex: 32-A-7845" />
          <Input label="Modèle"                   value={form.model}    onChange={e => setForm({ ...form, model: e.target.value })}    placeholder="ex: Mercedes Econic" />
          <Input label="Capacité (tonnes)" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="10" />
          <Select label="Statut" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="actif">Actif</option>
            <option value="maintenance">En maintenance</option>
            <option value="hors_service">Hors service</option>
          </Select>
          {error && (
            <div style={{ color: "#A32D2D", background: "#FCEBEB", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Annuler</Btn>
            <Btn onClick={save} style={{ opacity: saving ? 0.6 : 1, pointerEvents: saving ? "none" : "auto" }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}