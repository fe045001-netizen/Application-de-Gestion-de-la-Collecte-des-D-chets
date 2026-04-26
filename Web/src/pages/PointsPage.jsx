import { useState, useEffect, useRef } from "react";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Btn from "../components/ui/Btn";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix bug Webpack avec les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function MapModal({ point, points: allPoints, onClose }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const isAll = !point;
    const center = isAll ? [31.6295, -8.0083] : [point.lat, point.lng];
    const map = L.map(mapRef.current).setView(center, isAll ? 13 : 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const targets = isAll ? allPoints : [point];
    targets.forEach((p) => {
      const color = p.status === "actif" ? "#27500A" : "#888780";
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -10],
      });
      L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${p.name}</b><br>${p.zone} — ${p.type}`)
        .openPopup();
    });

    if (isAll && allPoints.length > 1) {
      map.fitBounds(allPoints.map((p) => [p.lat, p.lng]), { padding: [30, 30] });
    }

    return () => { map.remove(); };
  }, []);

  const title = point ? point.name : "Tous les points de collecte";
  const coords = point
    ? `Lat: ${point.lat}  |  Lng: ${point.lng}  |  Zone: ${point.zone}`
    : `${allPoints.length} points affichés`;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}
    >
      <div style={{ background:"#fff", borderRadius:16, width:580, maxWidth:"96vw", overflow:"hidden", border:"1px solid #eee" }}>
        <div style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f0f0f0" }}>
          <span style={{ fontWeight:600, fontSize:15 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#999" }}>✕</button>
        </div>
        <div ref={mapRef} style={{ width:"100%", height:360 }} />
        <div style={{ padding:"10px 20px", fontSize:12, color:"#888", background:"#fafafa", fontFamily:"monospace" }}>{coords}</div>
      </div>
    </div>
  );
}

export default function PointsPage({ points, setPoints, routes, user }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [search, setSearch]       = useState("");
  const [mapPoint, setMapPoint]   = useState(null);
  const [form, setForm] = useState({ name:"", lat:"", lng:"", zone:"", type:"conteneur", routeId:"", status:"actif" });

  const filtered = points.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.zone.toLowerCase().includes(search.toLowerCase())
  );

  const openNew  = () => { setEditing(null); setForm({ name:"", lat:"", lng:"", zone:"", type:"conteneur", routeId:"", status:"actif" }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p }); setShowModal(true); };

  const save = () => {
    if (editing) {
      setPoints(pts => pts.map(p => p.id === editing ? { ...form, id: editing } : p));
    } else {
      setPoints(pts => [...pts, { ...form, id: Date.now(), lat: parseFloat(form.lat), lng: parseFloat(form.lng), routeId: parseInt(form.routeId) || null }]);
    }
    setShowModal(false);
  };

  const remove = (id) => { if (window.confirm("Supprimer ce point ?")) setPoints(pts => pts.filter(p => p.id !== id)); };
  const canEdit = user.role === "admin" || user.role === "responsable";

  return (
    <div>
      <PageHeader
        title="Points de collecte"
        subtitle={`${points.length} points enregistrés`}
        action={
          <div style={{ display:"flex", gap:10 }}>
            {canEdit && <Btn onClick={openNew}>+ Nouveau point</Btn>}
            <Btn variant="secondary" onClick={() => setMapPoint("all")}> Voir tous sur carte</Btn>
          </div>
        }
      />

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #eee", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f5f5f5" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou zone..."
            style={{ width:"100%", padding:"8px 14px", border:"1px solid #eee", borderRadius:8, fontSize:14, outline:"none" }}
          />
        </div>

        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#fafafa" }}>
              {["Nom","Zone","Type","Tournée","GPS","Statut","Carte", canEdit && "Actions"].filter(Boolean).map(h => (
                <th key={h} style={{ padding:"12px 20px", textAlign:"left", fontSize:12, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderTop:"1px solid #f5f5f5" }}>
                <td style={{ padding:"14px 20px", fontSize:14, fontWeight:600 }}>{p.name}</td>
                <td style={{ padding:"14px 20px", fontSize:14, color:"#666" }}>{p.zone}</td>
                <td style={{ padding:"14px 20px" }}>
                  <span style={{ background:"#E6F1FB", color:"#185FA5", padding:"3px 10px", borderRadius:20, fontSize:12 }}>{p.type}</span>
                </td>
                <td style={{ padding:"14px 20px", fontSize:14, color:"#666" }}>
                  {routes.find(r => r.id === p.routeId)?.name || "—"}
                </td>
                <td style={{ padding:"14px 20px", fontSize:11, color:"#aaa", fontFamily:"monospace" }}>
                  {p.lat}, {p.lng}
                </td>
                <td style={{ padding:"14px 20px" }}><Badge status={p.status} /></td>
                <td style={{ padding:"14px 20px" }}>
                  <button
                    onClick={() => setMapPoint(p)}
                    style={{ background:"#E6F1FB", color:"#185FA5", border:"none", borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer", fontWeight:500 }}
                  >
                     Carte
                  </button>
                </td>
                {canEdit && (
                  <td style={{ padding:"14px 20px" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn variant="secondary" onClick={() => openEdit(p)} style={{ padding:"6px 12px", fontSize:12 }}>Éditer</Btn>
                      <Btn variant="danger"    onClick={() => remove(p.id)} style={{ padding:"6px 12px", fontSize:12 }}>Sup.</Btn>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:40, textAlign:"center", color:"#aaa" }}>Aucun point trouvé</div>}
      </div>

      {mapPoint && (
        <MapModal
          point={mapPoint === "all" ? null : mapPoint}
          points={points}
          onClose={() => setMapPoint(null)}
        />
      )}

      {showModal && (
        <Modal title={editing ? "Modifier le point" : "Nouveau point de collecte"} onClose={() => setShowModal(false)}>
          <Input label="Nom du point" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: Point A1 - Guéliz" />
          <Input label="Zone"         value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="ex: Guéliz" />
          <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="conteneur">Conteneur</option>
            <option value="bac">Bac</option>
            <option value="point_apport">Point d'apport volontaire</option>
          </Select>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Latitude"  value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} placeholder="31.6295" />
            <Input label="Longitude" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} placeholder="-8.0083" />
          </div>
          <Select label="Tournée associée" value={form.routeId} onChange={e => setForm({ ...form, routeId: e.target.value })}>
            <option value="">— Sans tournée —</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select label="Statut" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </Select>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:8 }}>
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Annuler</Btn>
            <Btn onClick={save}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}