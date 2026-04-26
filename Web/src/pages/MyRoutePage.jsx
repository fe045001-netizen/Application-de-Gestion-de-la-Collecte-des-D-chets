import { useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Btn from "../components/ui/Btn";
import {  useEffect, useRef } from "react";
const API_LOGS = "http://localhost/PhpFinalProject/api/logs";

async function apiLogs(method, path = "", body = null) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_LOGS}${path}`, {
      method,
      headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { return { ok:false, error:"Réponse invalide" }; }
    return { ok:res.ok, data, error:res.ok?null:(data?.error||`Erreur ${res.status}`) };
  } catch(e) { return { ok:false, error:"Réseau: "+e.message }; }
}

const STATUS_CFG = {
  "collecté":     { label:"Collecté",     bg:"#E1F5EE", color:"#0F6E56", dot:"#1D9E75" },
  "non_collecté": { label:"Non collecté", bg:"#FAEEDA", color:"#854F0B", dot:"#EF9F27" },
  "problème":     { label:"Incident",     bg:"#FCEBEB", color:"#A32D2D", dot:"#E24B4A" },
};

function StatusPill({ status }) {
  const s = STATUS_CFG[status] || { label:status, bg:"#f0f0f0", color:"#666", dot:"#aaa" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, color:s.color, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot }} />{s.label}
    </span>
  );
}

function RouteBadge({ status }) {
  const m = {
    "en_cours": { label:"En cours",  bg:"#E1F5EE", color:"#0F6E56" },
    "planifiée":{ label:"Planifiée", bg:"#FAEEDA", color:"#854F0B" },
    "terminée": { label:"Terminée",  bg:"#f0f0f0", color:"#888"    },
  };
  const s = m[status] || { label:status, bg:"#f0f0f0", color:"#666" };
  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:s.bg, color:s.color }}>{s.label}</span>;
}

function NoteModal({ point, onClose, onConfirm, saving }) {
  const [note, setNote] = useState("");
  return (
    <Modal title={`Signaler un problème — ${point.name}`} onClose={onClose}>
      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#444", marginBottom:6 }}>Description du problème</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="ex: Bac plein, accès bloqué, conteneur manquant..."
          style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #e0e0e0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical", minHeight:100, fontFamily:"inherit" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
        <Btn variant="secondary" onClick={onClose} style={{ opacity:saving?0.5:1, pointerEvents:saving?"none":"auto" }}>Annuler</Btn>
        <Btn variant="danger" onClick={()=>onConfirm(note)}
          style={{ opacity:(!note.trim()||saving)?0.5:1, pointerEvents:(!note.trim()||saving)?"none":"auto" }}>
          {saving?"Envoi…":"Signaler"}
        </Btn>
      </div>
    </Modal>
  );
}

function RouteCard({ route, points, logs, trucks, onMark, defaultOpen, savingKey }) {
  const [open, setOpen] = useState(defaultOpen);

  const getLog    = (pid) => logs.find(l=>parseInt(l.pointId)===parseInt(pid)&&parseInt(l.routeId)===parseInt(route.id));
  const collected = points.filter(p=>getLog(p.id)?.status==="collecté").length;
  const incidents = points.filter(p=>getLog(p.id)?.status==="problème").length;
  const pct       = points.length ? Math.round(collected/points.length*100) : 0;
  const isActive  = route.status === "en_cours";
  const routeColor = isActive ? "#1D9E75" : route.status==="planifiée" ? "#EF9F27" : "#aaa";
  const truck      = trucks.find(t=>parseInt(t.id)===parseInt(route.truckId));
  const truckLabel = truck ? `${truck.model} • ${truck.plate}` : null;

  return (
    <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${open?routeColor+"55":"#eee"}`, overflow:"hidden" }}>
      {/* Header */}
      <div onClick={()=>setOpen(o=>!o)}
        style={{ padding:"16px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, background:open?routeColor+"08":"#fff" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:15, fontWeight:700 }}>{route.name}</span>
            <RouteBadge status={route.status} />
          </div>
          <div style={{ fontSize:12, color:"#999", display:"flex", gap:12, flexWrap:"wrap" }}>
            {truckLabel && <span> {truckLabel}</span>}
            {route.date && <span> {new Date(route.date).toLocaleDateString("fr-FR")}</span>}
            <span style={{ fontWeight:600, color:routeColor }}>{collected}/{points.length} collectés</span>
            {incidents>0 && <span style={{ color:"#E24B4A" }}> {incidents} incident{incidents>1?"s":""}</span>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
          <div style={{ width:80 }}>
            <div style={{ background:"#f0f0f0", borderRadius:8, height:6, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:routeColor, borderRadius:8, transition:"width 0.4s" }} />
            </div>
            <div style={{ fontSize:11, color:"#bbb", textAlign:"right", marginTop:2 }}>{pct}%</div>
          </div>
          <span style={{ fontSize:18, color:"#ccc", display:"inline-block", transition:"transform 0.2s", transform:open?"rotate(90deg)":"none" }}>›</span>
        </div>
      </div>

      {/* Points */}
      {open && (
        <div style={{ borderTop:"1px solid #f0f0f0" }}>
          {points.length===0 ? (
            <div style={{ padding:28, textAlign:"center", color:"#bbb", fontSize:14 }}>
              Aucun point assigné à cette tournée.
            </div>
          ) : points.map((p, i) => {
            const log = getLog(p.id);
            const key = `${p.id}-${route.id}`;
            const isSaving = savingKey===key;
            const rowBg = log?.status==="collecté" ? "#f0faf7" : log?.status==="problème" ? "#fff9f9" : "#fff";
            return (
              <div key={p.id} style={{ padding:"14px 20px", borderBottom:i<points.length-1?"1px solid #f8f8f8":"none",
                display:"flex", alignItems:"center", gap:12, background:rowBg, opacity:isSaving?0.6:1, transition:"background 0.3s, opacity 0.2s" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, background:"#f0faf7",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#0F6E56" }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{p.name}</div>
                  <div style={{ fontSize:12, color:"#999" }}>{[p.zone,p.type].filter(Boolean).join(" • ")}</div>
                  {log?.note      && <div style={{ fontSize:12, color:"#E24B4A", marginTop:3 }}> {log.note}</div>}
                  {log?.timestamp && <div style={{ fontSize:11, color:"#ccc", marginTop:2 }}>
                    {new Date(log.timestamp).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                  </div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                  {log && <StatusPill status={log.status} />}
                  {isActive && (
                    <div style={{ display: "flex", gap: 10 }}>

  <button
    onClick={() => onMark(p, route, "collecté")}
    disabled={isSaving}
    title="Collecté"
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 600,
      cursor: isSaving ? "wait" : "pointer",
      background: log?.status === "collecté" ? "#0F6E56" : "#E1F5EE",
      color: log?.status === "collecté" ? "#fff" : "#0F6E56",
      border: "1px solid #0F6E56",
      transition: "0.2s",
    }}
  >
    Collecté
  </button>

  <button
    onClick={() => onMark(p, route, "non_collecté")}
    disabled={isSaving}
    title="Non collecté"
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 600,
      cursor: isSaving ? "wait" : "pointer",
      background: log?.status === "non_collecté" ? "#854F0B" : "#FAEEDA",
      color: log?.status === "non_collecté" ? "#fff" : "#854F0B",
      border: "1px solid #854F0B",
      transition: "0.2s",
    }}
  >
    Non collecté
  </button>

  {/* Problème */}
  <button
    onClick={() => onMark(p, route, "problème")}
    disabled={isSaving}
    title="Signaler problème"
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 600,
      cursor: isSaving ? "wait" : "pointer",
      background: log?.status === "problème" ? "#A32D2D" : "#FCEBEB",
      color: log?.status === "problème" ? "#fff" : "#A32D2D",
      border: "1px solid #A32D2D",
      transition: "0.2s",
    }}
  >
    Problème
  </button>

</div>
                  )}
                </div>
              </div>
            );
          })}

          {(() => {
            const zones = {};
            points.forEach(p => {
              if (!p.zone) return;
              if (!zones[p.zone]) zones[p.zone]={total:0,done:0};
              zones[p.zone].total++;
              if (getLog(p.id)?.status==="collecté") zones[p.zone].done++;
            });
            if (!Object.keys(zones).length) return null;
            return (
              <div style={{ padding:"12px 20px", background:"#fafafa", borderTop:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Par zone</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {Object.entries(zones).map(([zone,{total,done}])=>{
                    const c=done===total?"#1D9E75":done>0?"#EF9F27":"#888";
                    return (
                      <div key={zone} style={{ background:"#fff", border:"1px solid #eee", borderRadius:10, padding:"6px 14px", textAlign:"center", minWidth:72 }}>
                        <div style={{ fontSize:11, color:"#888" }}>{zone}</div>
                        <div style={{ fontSize:16, fontWeight:700, color:c }}>{done}/{total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function MyRoutePage({ user, points, routes, logs, setLogs, trucks, users=[], onRefresh }) {
  const [noteModal,   setNoteModal]   = useState(null);
  const [savingKey,   setSavingKey]   = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [apiError,    setApiError]    = useState("");
const [gpsActive,   setGpsActive]   = useState(false);
const [gpsError,    setGpsError]    = useState("");
const [gpsStatus,   setGpsStatus]   = useState(""); // "envoi...", "OK", "erreur"
const gpsIntervalRef = useRef(null);

const sendPosition = (lat, lng) => {
  const activeRoute = myRoutes.find(r => r.status === "en_cours");
  fetch("http://localhost/PhpFinalProject/api/positions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id:   user.id,
      user_name: user.name || user.username,
      lat, lng,
      route_id:  activeRoute?.id || null,
    }),
  })
  .then(r => r.json())
  .then(() => setGpsStatus(" Position envoyée"))
  .catch(() => setGpsStatus(" Erreur envoi"));
};

const toggleGps = () => {
  if (gpsActive) {
    clearInterval(gpsIntervalRef.current);
    setGpsActive(false);
    setGpsStatus("");
    return;
  }
  if (!navigator.geolocation) {
    setGpsError("GPS non supporté par ce navigateur.");
    return;
  }
  setGpsActive(true);
  setGpsError("");
  // Envoi immédiat puis toutes les 30 secondes
  const send = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus("envoi...");
        sendPosition(pos.coords.latitude, pos.coords.longitude);
      },
      () => setGpsStatus(" GPS refusé")
    );
  };
  send();
  gpsIntervalRef.current = setInterval(send, 30000);
};

// Nettoyage au démontage
useEffect(() => () => clearInterval(gpsIntervalRef.current), []);
  const isDriver = user.role === "chauffeur";

  let myRoutes = [];
  if (isDriver) {
    const uid = parseInt(user.id);

    // Méthode 1 : tournée a driver_id = cet utilisateur
    const byDriver = routes.filter(r => parseInt(r.driverId) === uid);

    // Méthode 2 (fallback) : camion assigné → tournées de ce camion
    const myTruck  = trucks.find(t => parseInt(t.driverId||t.driver_id) === uid);
    const byTruck  = myTruck ? routes.filter(r => parseInt(r.truckId) === parseInt(myTruck.id)) : [];

    // Union sans doublons
    const ids = new Set([...byDriver.map(r=>r.id), ...byTruck.map(r=>r.id)]);
    myRoutes = routes.filter(r => ids.has(r.id));
  } else {
    myRoutes = routes;
  }

  myRoutes = [...myRoutes].sort((a,b)=>{
    const o={"en_cours":0,"planifiée":1,"terminée":2};
    return (o[a.status]??9)-(o[b.status]??9)||new Date(b.date)-new Date(a.date);
  });

  const pointsForRoute = (routeId) => points.filter(p=>parseInt(p.routeId)===parseInt(routeId));
  const getLog = (pointId, routeId) => logs.find(l=>parseInt(l.pointId)===parseInt(pointId)&&parseInt(l.routeId)===parseInt(routeId));

  function handleMark(point, route, status) {
    if (status==="problème") { setNoteModal({point,route}); return; }
    persistMark(point, route, status, "");
  }

  async function handleProblemConfirm(note) {
    const {point,route}=noteModal;
    setModalSaving(true);
    await persistMark(point, route, "problème", note);
    setModalSaving(false);
    setNoteModal(null);
  }

  async function persistMark(point, route, status, note) {
    const existing = getLog(point.id, route.id);
    const key = `${point.id}-${route.id}`;

    if (existing?.status==="collecté" && status==="collecté") {
      alert("Ce point est déjà collecté sur cette tournée.");
      return;
    }

    setSavingKey(key);
    setApiError("");

    let result;
    if (existing) {
      result = await apiLogs("PUT", `/${existing.id}`, {status, note});
      if (result.ok) {
        setLogs(prev=>prev.map(l=>l.id===existing.id?{...l,status,note,timestamp:new Date().toISOString()}:l));
      }
    } else {
      result = await apiLogs("POST", "", { point_id:parseInt(point.id), route_id:parseInt(route.id), status, note });
      if (result.ok) {
        setLogs(prev=>[...prev,{
          id:result.data?.id||Date.now(), pointId:parseInt(point.id),
          routeId:parseInt(route.id), status, note, timestamp:new Date().toISOString(),
        }]);
      }
    }

    if (!result.ok) {
      setApiError(`Erreur: ${result.error}`);
      // Mise à jour locale même si API échoue
      if (existing) {
        setLogs(prev=>prev.map(l=>l.id===existing.id?{...l,status,note,timestamp:new Date().toISOString()}:l));
      } else {
        setLogs(prev=>[...prev,{id:Date.now(),pointId:parseInt(point.id),routeId:parseInt(route.id),status,note,timestamp:new Date().toISOString()}]);
      }
    }

    setSavingKey(null);
    if (typeof onRefresh === "function") onRefresh();
  }
const allMyLogs = logs.filter(l => myRoutes.some(r => parseInt(r.id) === parseInt(l.routeId)));

// Dédoublonner : garder le log le plus récent par (pointId, routeId)
const latestLogs = Object.values(
  allMyLogs.reduce((acc, l) => {
    const key = `${l.pointId}-${l.routeId}`;
    if (!acc[key] || new Date(l.timestamp) > new Date(acc[key].timestamp)) {
      acc[key] = l;
    }
    return acc;
  }, {})
);

const totalCollected = latestLogs.filter(l => l.status === "collecté").length;
const totalIncidents = latestLogs.filter(l => l.status === "problème").length; 
const activeRoutes   = myRoutes.filter(r=>r.status==="en_cours");
  const otherRoutes    = myRoutes.filter(r=>r.status!=="en_cours");
  const primaryRoute   = activeRoutes[0]||null;

  // Cas vide
  if (isDriver && myRoutes.length===0) {
    return (
      <div>
        <PageHeader title="Ma tournée" subtitle="Aucune tournée assignée" />
        <div style={{ background:"#fff", borderRadius:16, padding:48, textAlign:"center", border:"1px solid #eee" }}>
          <p style={{ color:"#888", marginBottom:4 }}>Aucune tournée assignée à votre compte.</p>
          <p style={{ fontSize:13, color:"#bbb" }}>Contactez votre responsable de propreté.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isDriver?"Ma tournée":"Toutes les tournées"}
        subtitle={primaryRoute?`Tournée active : ${primaryRoute.name}`:`${myRoutes.length} tournée${myRoutes.length!==1?"s":""}`}
        action={
          <button onClick={onRefresh}
            style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:12, color:"#666" }}>
            Actualiser
          </button>
        }
      />
{isDriver && (
  <div style={{ background:"#fff", borderRadius:16, padding:"16px 20px", border:"1px solid #eee", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
    <div>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>Partage de position GPS</div>
      <div style={{ fontSize:12, color:"#999" }}>
        {gpsActive ? "Position envoyée toutes les 30 secondes au responsable" : "Activez pour que le responsable voie votre position en direct"}
      </div>
      {gpsError  && <div style={{ fontSize:12, color:"#E24B4A", marginTop:4 }}>{gpsError}</div>}
      {gpsStatus && <div style={{ fontSize:12, color: gpsStatus.includes("") ? "#0F6E56" : "#E24B4A", marginTop:4 }}>{gpsStatus}</div>}
    </div>
    <button onClick={toggleGps} style={{
      padding:"10px 20px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer", border:"none",
      background: gpsActive ? "#E24B4A" : "#1D9E75",
      color:"#fff", display:"flex", alignItems:"center", gap:8,
    }}>
      {gpsActive ? "⏹ Arrêter le partage" : " Envoyer ma position"}
    </button>
  </div>
)}
      {apiError && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", padding:"10px 16px", borderRadius:10, fontSize:13, marginBottom:16, display:"flex", justifyContent:"space-between" }}>
          <span> {apiError}</span>
          <button onClick={()=>setApiError("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Tournées actives", value:activeRoutes.length,             color:"#1D9E75" },
{ label:"Points assignés", value: new Set(myRoutes.flatMap(r => pointsForRoute(r.id).map(p => p.id))).size, color:"#378ADD" },          { label:"Points collectés", value:totalCollected,                  color:"#1D9E75" },
          { label:"Incidents",        value:totalIncidents,                  color:totalIncidents>0?"#E24B4A":"#aaa" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#f7f9f8", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:12, color:"#888", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Barre progression tournée principale */}
      {primaryRoute && (()=>{
        const pts  = pointsForRoute(primaryRoute.id);
        const done = pts.filter(p=>getLog(p.id,primaryRoute.id)?.status==="collecté").length;
        const pct  = pts.length ? Math.round(done/pts.length*100) : 0;
        const c    = pct===100?"#1D9E75":pct>=50?"#EF9F27":"#E24B4A";
        return (
          <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid #eee", marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:"#888" }}>{done}/{pts.length} points — {primaryRoute.name}</span>
              <span style={{ fontSize:13, fontWeight:700, color:c }}>{pct}%</span>
            </div>
            <div style={{ background:"#f0f0f0", borderRadius:8, height:8, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:8, transition:"width 0.5s" }} />
            </div>
          </div>
        );
      })()}

      {activeRoutes.length>0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            Tournée{activeRoutes.length>1?"s":""} en cours ({activeRoutes.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {activeRoutes.map((r,i)=>(
              <RouteCard key={r.id} route={r} points={pointsForRoute(r.id)} logs={logs} trucks={trucks}
                onMark={handleMark} defaultOpen={i===0} savingKey={savingKey} />
            ))}
          </div>
        </div>
      )}

      {otherRoutes.length>0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
            Autres tournées ({otherRoutes.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {otherRoutes.map(r=>(
              <RouteCard key={r.id} route={r} points={pointsForRoute(r.id)} logs={logs} trucks={trucks}
                onMark={handleMark} defaultOpen={false} savingKey={savingKey} />
            ))}
          </div>
        </div>
      )}

      {noteModal && (
        <NoteModal point={noteModal.point} onClose={()=>{ if(!modalSaving) setNoteModal(null); }}
          onConfirm={handleProblemConfirm} saving={modalSaving} />
      )}
    </div>
  );
}