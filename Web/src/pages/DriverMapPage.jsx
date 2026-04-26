import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

const API = "http://localhost/PhpFinalProject/api/positions";

export default function DriverMapPage({ routes, points }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef({});
  const [drivers,   setDrivers]   = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error,     setError]     = useState("");

  const fetchPositions = async () => {
    try {
      const res  = await fetch(API);
      const data = await res.json();
      setDrivers(data);
      setLastUpdate(new Date());
      setError("");
      updateMarkers(data);
    } catch {
      setError("Impossible de récupérer les positions.");
    }
  };

  const updateMarkers = (data) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // Supprimer anciens marqueurs
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    data.forEach(d => {
      // Vérifier si position récente (< 5 minutes)
      const age = (new Date() - new Date(d.timestamp)) / 1000 / 60;
      const isRecent = age < 5;
      const color = isRecent ? "#1D9E75" : "#888";

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center">
            <div style="background:${color};color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25)">
               ${d.user_name}
            </div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color}"></div>
          </div>`,
        iconSize:   [120, 40],
        iconAnchor: [60, 40],
        popupAnchor:[0, -44],
      });

      const route = routes?.find(r => parseInt(r.id) === parseInt(d.route_id));
      const popup = `
        <div style="font-family:sans-serif;min-width:180px">
          <b style="font-size:14px"> ${d.user_name}</b><br/>
          ${route ? `<span style="color:#888;font-size:12px">Tournée : ${route.name}</span><br/>` : ""}
          <span style="color:#888;font-size:11px">
            ${isRecent ? `Il y a ${Math.round(age * 60)} sec` : `Hors ligne (${Math.round(age)} min)`}
          </span><br/>
          <span style="font-family:monospace;font-size:11px;color:#aaa">${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</span>
        </div>`;

      const marker = L.marker([d.lat, d.lng], { icon })
        .addTo(map)
        .bindPopup(popup);

      markersRef.current[d.user_id] = marker;
    });

    // Zoom sur tous les chauffeurs
    if (data.length > 0) {
      const bounds = data.map(d => [d.lat, d.lng]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current).setView([31.6295, -8.0083], 13);
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    }).addTo(map);

    fetchPositions();
    const interval = setInterval(fetchPositions, 15000); // refresh toutes les 15 sec

    return () => {
      clearInterval(interval);
      map.remove();
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Positions des chauffeurs"
        subtitle={lastUpdate ? `Mis à jour : ${lastUpdate.toLocaleTimeString("fr-FR")}` : "Chargement..."}
        action={
          <button onClick={fetchPositions}
            style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:12, color:"#666" }}>
             Actualiser
          </button>
        }
      />

      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", padding:"10px 16px", borderRadius:10, fontSize:13, marginBottom:16 }}>
          {error}
        </div>
      )}

      {/* Liste chauffeurs actifs */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        {drivers.length === 0 ? (
          <div style={{ fontSize:13, color:"#aaa" }}>Aucun chauffeur actif pour le moment.</div>
        ) : drivers.map(d => {
          const age = (new Date() - new Date(d.timestamp)) / 1000 / 60;
          const isRecent = age < 5;
          return (
            <div key={d.user_id} style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background: isRecent ? "#1D9E75" : "#ccc" }} />
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{d.user_name}</div>
                <div style={{ fontSize:11, color:"#aaa" }}>{isRecent ? `Actif (${Math.round(age*60)}s)` : `Hors ligne (${Math.round(age)} min)`}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carte */}
      <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid #eee" }}>
        <div ref={mapRef} style={{ width:"100%", height:520 }} />
      </div>
    </div>
  );
}