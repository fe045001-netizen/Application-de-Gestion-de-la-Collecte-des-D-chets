import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getLogs, getPoints, getRoutes, sendPosition } from "../utils/api";

export default function HomeScreen({ navigation, user, onLogout }) {
  const [routes,      setRoutes]      = useState([]);
  const [logs,        setLogs]        = useState([]);
  const [points,      setPoints]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // GPS
  const [gpsActive,  setGpsActive]  = useState(false);
  const [gpsStatus,  setGpsStatus]  = useState("");
  const [lastPos,    setLastPos]    = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const intervalRef = useRef(null);

  const loadData = async () => {
    const [rR, rL, rP] = await Promise.all([getRoutes(), getLogs(), getPoints()]);
    if (rR.ok) setRoutes(normalizeRoutes(rR.data));
    if (rL.ok) setLogs(normalizeLogs(rL.data));
    if (rP.ok) setPoints(rP.data);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  // Nettoyage GPS au démontage
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const myRoutes    = routes.filter(r =>
    parseInt(r.driverId) === parseInt(user.id) || r.status === "en_cours"
  );
  const activeRoute = myRoutes.find(r => r.status === "en_cours");
  const myPoints    = activeRoute ? points.filter(p => parseInt(p.route_id ?? p.routeId) === parseInt(activeRoute.id)) : [];
  const myLogs      = activeRoute ? logs.filter(l => parseInt(l.routeId) === parseInt(activeRoute.id)) : [];
  const collected   = myLogs.filter(l => l.status === "collecté").length;
  const incidents   = myLogs.filter(l => l.status === "problème").length;
  const pct         = myPoints.length ? Math.round(collected / myPoints.length * 100) : 0;

  // ── GPS ────────────────────────────────────────────────────────────────────
  const doSend = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;
      setLastPos({ lat: latitude, lng: longitude, time: new Date() });

      const res = await sendPosition(
        user.id,
        user.name || user.email,
        latitude,
        longitude,
        activeRoute?.id || null
      );
      setGpsStatus(res.ok ? "Position envoyée" : " Erreur envoi");
    } catch {
      setGpsStatus(" Impossible d'obtenir la position");
    }
  };

  const toggleGps = async () => {
    if (gpsActive) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setGpsActive(false);
      setGpsStatus("Partage arrêté");
      return;
    }

    setGpsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGpsLoading(false);

    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la localisation dans les paramètres de l'application."
      );
      return;
    }

    setGpsActive(true);
    setGpsStatus("Démarrage...");
    await doSend();
    intervalRef.current = setInterval(doSend, 30000);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text style={{ color: "#888", marginTop: 12 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F6E56" />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour </Text>
          <Text style={styles.userName}>{user.name || user.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}> Chauffeur</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutTxt}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* ── Carte GPS ───────────────────────────────────────────────────── */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsTitle}> Partage de position GPS</Text>
            <Text style={styles.gpsSub}>
              {gpsActive
                ? "Position envoyée toutes les 30 secondes"
                : "Désactivé — activez pour partager votre position"}
            </Text>
           
            {lastPos && (
              <Text style={styles.gpsCoords}>
                {lastPos.lat.toFixed(5)}, {lastPos.lng.toFixed(5)} —{" "}
                {lastPos.time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            )}
          </View>
          {gpsLoading
            ? <ActivityIndicator color="#0F6E56" style={{ marginLeft: 12 }} />
            : (
              <Switch
                value={gpsActive}
                onValueChange={toggleGps}
                trackColor={{ false: "#ddd", true: "#1D9E75" }}
                thumbColor={gpsActive ? "#0F6E56" : "#f4f3f4"}
              />
            )
          }
        </View>

        {/* Bouton envoi manuel */}
        {gpsActive && (
          <TouchableOpacity onPress={doSend} style={styles.gpsSendBtn}>
            <Text style={styles.gpsSendTxt}> Envoyer maintenant</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* ────────────────────────────────────────────────────────────────── */}

      {/* Tournée active */}
      {activeRoute ? (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeBadge}>EN COURS</Text>
            <Text style={styles.activeDate}> {activeRoute.date}</Text>
          </View>
          <Text style={styles.activeName}>{activeRoute.name}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressTxt}>{collected}/{myPoints.length} collectés</Text>
            <Text style={[styles.progressPct, { color: pct === 100 ? "#1D9E75" : "#fff" }]}>{pct}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <TouchableOpacity style={styles.goBtn}
            onPress={() => navigation.navigate("MyRoute", { user, routeId: activeRoute.id })}>
            <Text style={styles.goBtnTxt}>Voir ma tournée →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noRouteCard}>
          <Text style={styles.noRouteEmoji}>Camion</Text>
          <Text style={styles.noRouteTxt}>Aucune tournée en cours</Text>
          <Text style={styles.noRouteSub}>Contactez votre responsable</Text>
        </View>
      )}

      {/* Stats */}
      <Text style={styles.sectionTitle}>Statistiques du jour</Text>
      <View style={styles.statsGrid}>
        {[
          { label:"Collectés",    value:collected,                              color:"#1D9E75", bg:"#D4F5E2", },
          { label:"Restants",     value:Math.max(0, myPoints.length-collected), color:"#EF9F27", bg:"#FAEEDA" },
          { label:"Incidents",    value:incidents,                              color:"#E24B4A", bg:"#FCEBEB",  },
          { label:"Total points", value:myPoints.length,                        color:"#378ADD", bg:"#E6F1FB" },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Toutes les tournées */}
      <Text style={styles.sectionTitle}>Mes tournées</Text>
      {myRoutes.length === 0
        ? <Text style={styles.emptyTxt}>Aucune tournée assignée</Text>
        : myRoutes.map(r => (
            <TouchableOpacity key={r.id} style={styles.routeRow}
              onPress={() => navigation.navigate("MyRoute", { user, routeId: r.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeName}>{r.name}</Text>
                <Text style={styles.routeDate}>{r.date}</Text>
              </View>
              <View style={[styles.routeStatusPill, {
                backgroundColor: r.status==="en_cours" ? "#D4F5E2" : r.status==="terminée" ? "#f0f0f0" : "#FAEEDA"
              }]}>
                <Text style={{ fontSize:11, fontWeight:"700",
                  color: r.status==="en_cours" ? "#0F6E56" : r.status==="terminée" ? "#888" : "#854F0B" }}>
                  {r.status==="en_cours" ? "En cours" : r.status==="terminée" ? "Terminée" : "Planifiée"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
      }

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function normalizeRoutes(raw) {
  return (Array.isArray(raw) ? raw : []).map(r => ({
    id:        r.id,
    name:      r.name,
    date:      r.date,
    status:    r.status    || "planifiée",
    truckId:   parseInt(r.truck_id  ?? r.truckId)  || null,
    driverId:  parseInt(r.driver_id ?? r.driverId) || null,
    truckName: r.truck_name ?? null,
  }));
}

function normalizeLogs(raw) {
  return (Array.isArray(raw) ? raw : []).map(l => ({
    id:        l.id,
    pointId:   parseInt(l.point_id  ?? l.pointId),
    routeId:   parseInt(l.route_id  ?? l.routeId),
    status:    l.status,
    note:      l.note || "",
    timestamp: l.timestamp,
  }));
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:"#f7f8fa" },
  centered:     { flex:1, alignItems:"center", justifyContent:"center" },
  header:       { backgroundColor:"#0F6E56", padding:24, paddingTop:52, flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start" },
  greeting:     { fontSize:14, color:"rgba(255,255,255,0.7)" },
  userName:     { fontSize:22, fontWeight:"800", color:"#fff", marginTop:2 },
  rolePill:     { backgroundColor:"rgba(255,255,255,0.2)", borderRadius:20, paddingHorizontal:10, paddingVertical:4, alignSelf:"flex-start", marginTop:8 },
  roleText:     { fontSize:12, color:"#fff", fontWeight:"600" },
  logoutBtn:    { backgroundColor:"rgba(255,255,255,0.15)", borderRadius:10, paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:"rgba(255,255,255,0.2)" },
  logoutTxt:    { color:"#fff", fontSize:13 },

  // GPS
  gpsCard:      { margin:16, marginBottom:8, backgroundColor:"#fff", borderRadius:16, padding:16, borderWidth:1, borderColor:"#e8f5ef", shadowColor:"#0F6E56", shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  gpsRow:       { flexDirection:"row", alignItems:"center", gap:12 },
  gpsTitle:     { fontSize:14, fontWeight:"700", color:"#1a1a1a", marginBottom:3 },
  gpsSub:       { fontSize:12, color:"#999", lineHeight:18 },
  gpsStatusTxt: { fontSize:12, fontWeight:"600", marginTop:6 },
  gpsCoords:    { fontSize:11, color:"#aaa", fontVariant:["tabular-nums"], marginTop:3 },
  gpsSendBtn:   { marginTop:12, backgroundColor:"#E1F5EE", borderRadius:10, padding:11, alignItems:"center" },
  gpsSendTxt:   { color:"#0F6E56", fontWeight:"700", fontSize:13 },

  activeCard:   { margin:16, backgroundColor:"#0F6E56", borderRadius:20, padding:20, shadowColor:"#0F6E56", shadowOpacity:0.3, shadowRadius:10, elevation:5 },
  activeHeader: { flexDirection:"row", justifyContent:"space-between", marginBottom:8 },
  activeBadge:  { fontSize:10, fontWeight:"800", color:"#fff", backgroundColor:"rgba(255,255,255,0.2)", paddingHorizontal:8, paddingVertical:3, borderRadius:10 },
  activeDate:   { fontSize:12, color:"rgba(255,255,255,0.7)" },
  activeName:   { fontSize:18, fontWeight:"700", color:"#fff", marginBottom:16 },
  progressRow:  { flexDirection:"row", justifyContent:"space-between", marginBottom:6 },
  progressTxt:  { fontSize:13, color:"rgba(255,255,255,0.8)" },
  progressPct:  { fontSize:13, fontWeight:"700" },
  progressBg:   { backgroundColor:"rgba(255,255,255,0.2)", borderRadius:8, height:8, overflow:"hidden", marginBottom:18 },
  progressFill: { height:"100%", backgroundColor:"#fff", borderRadius:8 },
  goBtn:        { backgroundColor:"#fff", borderRadius:12, padding:14, alignItems:"center" },
  goBtnTxt:     { color:"#0F6E56", fontWeight:"700", fontSize:15 },

  noRouteCard:  { margin:16, backgroundColor:"#fff", borderRadius:20, padding:32, alignItems:"center", borderWidth:1, borderColor:"#eee" },
  noRouteEmoji: { fontSize:40, marginBottom:10 },
  noRouteTxt:   { fontSize:16, fontWeight:"600", color:"#444" },
  noRouteSub:   { fontSize:13, color:"#aaa", marginTop:4 },

  sectionTitle: { fontSize:14, fontWeight:"700", color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginHorizontal:16, marginTop:8, marginBottom:10 },
  statsGrid:    { flexDirection:"row", flexWrap:"wrap", marginHorizontal:10, gap:10, marginBottom:16 },
  statCard:     { width:"46%", borderRadius:14, padding:16, marginHorizontal:"2%" },
  statIcon:     { fontSize:22, marginBottom:6 },
  statValue:    { fontSize:28, fontWeight:"800" },
  statLabel:    { fontSize:12, color:"#666", marginTop:2 },

  routeRow:         { marginHorizontal:16, marginBottom:10, backgroundColor:"#fff", borderRadius:14, padding:16, flexDirection:"row", alignItems:"center", borderWidth:1, borderColor:"#eee" },
  routeName:        { fontSize:14, fontWeight:"700", color:"#1a1a1a" },
  routeDate:        { fontSize:12, color:"#888", marginTop:2 },
  routeStatusPill:  { borderRadius:20, paddingHorizontal:10, paddingVertical:5 },
  emptyTxt:         { textAlign:"center", color:"#aaa", fontSize:14, marginTop:8 },
});