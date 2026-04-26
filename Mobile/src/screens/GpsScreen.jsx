import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { sendPosition } from "../utils/api";

export default function GpsScreen({ user, activeRoute }) {
  const [gpsActive,  setGpsActive]  = useState(false);
  const [gpsStatus,  setGpsStatus]  = useState("");
  const [lastPos,    setLastPos]     = useState(null);
  const [loading,    setLoading]     = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const doSend = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
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

    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLoading(false);

    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la localisation dans les paramètres.");
      return;
    }

    setGpsActive(true);
    setGpsStatus("Démarrage...");
    await doSend(); // envoi immédiat
    intervalRef.current = setInterval(doSend, 30000); // puis toutes les 30s
  };

  return (
    <View style={styles.container}>

      {/* Carte statut */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Partage de position GPS</Text>
            <Text style={styles.cardSub}>
              {gpsActive
                ? "Position envoyée toutes les 30 secondes"
                : "Désactivé — le responsable ne voit pas votre position"}
            </Text>
          </View>
          {loading
            ? <ActivityIndicator color="#0F6E56" />
            : <Switch
                value={gpsActive}
                onValueChange={toggleGps}
                trackColor={{ false: "#ddd", true: "#1D9E75" }}
                thumbColor={gpsActive ? "#0F6E56" : "#f4f3f4"}
              />
          }
        </View>

        {gpsStatus !== "" && (
          <View style={[styles.statusBar, { backgroundColor: gpsStatus.includes("") ? "#E1F5EE" : gpsStatus.includes("❌") ? "#FCEBEB" : "#f0f0f0" }]}>
            <Text style={{ fontSize: 13, color: gpsStatus.includes("") ? "#0F6E56" : gpsStatus.includes("❌") ? "#A32D2D" : "#666" }}>
              {gpsStatus}
            </Text>
          </View>
        )}
      </View>

      {/* Dernière position */}
      {lastPos && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}> Dernière position envoyée</Text>
          <Text style={styles.coordTxt}>Lat : {lastPos.lat.toFixed(6)}</Text>
          <Text style={styles.coordTxt}>Lng : {lastPos.lng.toFixed(6)}</Text>
          <Text style={styles.timeTxt}>
            {lastPos.time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </Text>
        </View>
      )}

      {/* Tournée active */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}> Tournée active</Text>
        {activeRoute ? (
          <>
            <Text style={styles.routeName}>{activeRoute.name}</Text>
            <View style={[styles.badge, { backgroundColor: "#E1F5EE" }]}>
              <Text style={{ fontSize: 12, color: "#0F6E56", fontWeight: "700" }}>En cours</Text>
            </View>
          </>
        ) : (
          <Text style={styles.cardSub}>Aucune tournée en cours</Text>
        )}
      </View>

      {/* Bouton manuel */}
      <TouchableOpacity
        onPress={doSend}
        disabled={!gpsActive}
        style={[styles.btnManual, { opacity: gpsActive ? 1 : 0.4 }]}
      >
        <Text style={styles.btnTxt}> Envoyer ma position maintenant</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f7f8fa", padding: 16, gap: 14 },
  card:       { backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle:  { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  cardSub:    { fontSize: 12, color: "#999", lineHeight: 18 },
  statusBar:  { marginTop: 12, borderRadius: 8, padding: "10px 12px", paddingHorizontal: 12, paddingVertical: 8 },
  coordTxt:   { fontSize: 13, fontFamily: "monospace", color: "#444", marginTop: 4 },
  timeTxt:    { fontSize: 11, color: "#aaa", marginTop: 6 },
  routeName:  { fontSize: 15, fontWeight: "700", color: "#0F6E56", marginBottom: 8 },
  badge:      { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  btnManual:  { backgroundColor: "#0F6E56", borderRadius: 14, padding: 16, alignItems: "center" },
  btnTxt:     { color: "#fff", fontSize: 14, fontWeight: "700" },
});