import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert, Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import StatusBadge from "../components/StatusBadge";
import { createLog, updateLog } from "../utils/api";

const ACTION_BUTTONS = [
  { status: "collecté",      label: "Collecté",     bg: "#D4F5E2", color: "#0F6E56", activeBg: "#0F6E56" },
  { status: "non_collecté",  label: "Non collecté", bg: "#FAEEDA", color: "#854F0B", activeBg: "#EF9F27" },
  { status: "problème",      label: "Problème",     bg: "#FCEBEB", color: "#A32D2D", activeBg: "#E24B4A" },
];

export default function PointDetailScreen({ navigation, route: navRoute }) {
  const { point, route, log: initialLog, user } = navRoute.params;

  const [log,         setLog]         = useState(initialLog);
  const [status,      setStatus]      = useState(initialLog?.status || "");
  const [note,        setNote]        = useState(initialLog?.note   || "");
  const [showNote,    setShowNote]    = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [location,    setLocation]    = useState(null);

  const isActive = route.status === "en_cours";

  // Appuyer sur un bouton d'action
  const handleAction = (newStatus) => {
    if (newStatus === "problème") {
      setPendingStatus("problème");
      setShowNote(true);
      return;
    }
    confirmMark(newStatus, "");
  };

  const confirmMark = async (newStatus, noteText) => {
    if (!isActive) { Alert.alert("Tournée inactive", "Cette tournée n'est pas en cours."); return; }

    // Règle métier : ne pas recollecté sans justification
    if (log?.status === "collecté" && newStatus === "collecté") {
      Alert.alert("Déjà collecté", "Ce point a déjà été marqué comme collecté sur cette tournée.");
      return;
    }

    setSaving(true);
    let result;

    if (log?.id) {
      result = await updateLog(log.id, newStatus, noteText);
    } else {
      result = await createLog(point.id, route.id, newStatus, noteText);
    }

    setSaving(false);

    if (!result.ok) {
      Alert.alert("Erreur", result.error || "Impossible de sauvegarder");
      return;
    }

    const newLog = {
      id:        result.data?.id || log?.id || Date.now(),
      pointId:   point.id,
      routeId:   route.id,
      status:    newStatus,
      note:      noteText,
      timestamp: new Date().toISOString(),
    };

    setLog(newLog);
    setStatus(newStatus);
    setNote(noteText);
    setShowNote(false);
  };

  const getGPS = async () => {
    setGpsLoading(true);
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire.");
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      Alert.alert("Position envoyée", `Lat: ${loc.coords.latitude.toFixed(5)}\nLng: ${loc.coords.longitude.toFixed(5)}`);
    } catch (err) {
      Alert.alert("Erreur GPS", err.message);
    }
    setGpsLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f8fa" }}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
  <Text style={s.backText}>← Retour</Text>
</TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{point.name}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>

        {/* Info carte */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Text style={{ fontSize: 26 }}>localisation</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointName}>{point.name}</Text>
              {point.lat && point.lng ? (
                <Text style={styles.gpsCoords}>GPS : {point.lat.toFixed(5)}, {point.lng.toFixed(5)}</Text>
              ) : null}
            </View>
          </View>

          {/* Statut actuel */}
          {log ? (
            <View style={styles.currentStatus}>
              <Text style={styles.currentStatusLbl}>Statut actuel</Text>
              <StatusBadge status={log.status} />
              {log.note ? (
                <View style={styles.noteDisplay}>
                  <Text style={styles.noteDisplayTxt}> {log.note}</Text>
                </View>
              ) : null}
              {log.timestamp ? (
                <Text style={styles.timestamp}>
                  {new Date(log.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.noStatus}>
              <Text style={styles.noStatusTxt}>En attente de collecte</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {isActive ? (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Marquer ce point</Text>
            <View style={styles.actionBtns}>
              {ACTION_BUTTONS.map(btn => {
                const isSelected = status === btn.status;
                return (
                  <TouchableOpacity key={btn.status}
                    onPress={() => handleAction(btn.status)}
                    disabled={saving}
                    activeOpacity={0.8}
                    style={[styles.actionBtn, { backgroundColor: isSelected ? btn.activeBg : btn.bg, borderWidth: isSelected ? 2 : 0, borderColor: btn.activeBg }]}>
                    <Text style={styles.actionEmoji}>{btn.emoji}</Text>
                    <Text style={[styles.actionLabel, { color: isSelected ? "#fff" : btn.color }]}>{btn.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {saving && (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color="#0F6E56" />
                <Text style={styles.savingTxt}>Enregistrement...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.inactiveCard}>
            <Text style={styles.inactiveTxt}>Tournée non active — marquage désactivé</Text>
          </View>
        )}

        {/* GPS */}
        <View style={styles.gpsCard}>
          <Text style={styles.actionsTitle}> Envoyer ma position (optionnel)</Text>
          <TouchableOpacity style={styles.gpsBtn} onPress={getGPS} disabled={gpsLoading}>
            {gpsLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.gpsBtnTxt}> Obtenir ma position GPS</Text>
            }
          </TouchableOpacity>
          {location ? (
            <View style={styles.locationResult}>
              <Text style={styles.locationTxt}> Position obtenue</Text>
              <Text style={styles.locationCoords}>Lat: {location.latitude.toFixed(6)}</Text>
              <Text style={styles.locationCoords}>Lng: {location.longitude.toFixed(6)}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal note problème */}
      <Modal visible={showNote} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}> Décrire le problème</Text>
            <Text style={styles.modalSub}>{point.name}</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="ex: Bac plein, accès bloqué, route fermée..."
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowNote(false); setPendingStatus(""); setNote(log?.note || ""); }}>
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, !note.trim() && styles.modalConfirmDisabled]}
                onPress={() => note.trim() && confirmMark("problème", note)}
                disabled={!note.trim()}>
                <Text style={styles.modalConfirmTxt}>Signaler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header:          { backgroundColor: "#0F6E56", paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn:         { paddingRight: 4 },
  backTxt:         { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  headerTitle:     { flex: 1, fontSize: 16, fontWeight: "700", color: "#fff" },

  infoCard:        { backgroundColor: "#fff", margin: 14, borderRadius: 18, padding: 18, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  infoRow:         { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 16 },
  infoIconBox:     { width: 52, height: 52, borderRadius: 14, backgroundColor: "#f0faf7", alignItems: "center", justifyContent: "center" },
  pointName:       { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  pointMeta:       { fontSize: 13, color: "#888" },
  gpsCoords:       { fontSize: 11, color: "#bbb", marginTop: 4, fontFamily: "monospace" },
  currentStatus:   { borderTopWidth: 1, borderTopColor: "#f5f5f5", paddingTop: 14 },
  currentStatusLbl:{ fontSize: 12, color: "#aaa", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  noteDisplay:     { backgroundColor: "#fff5f5", borderRadius: 8, padding: 10, marginTop: 8 },
  noteDisplayTxt:  { fontSize: 13, color: "#E24B4A" },
  timestamp:       { fontSize: 11, color: "#ccc", marginTop: 6 },
  noStatus:        { backgroundColor: "#fafafa", borderRadius: 10, padding: 12, alignItems: "center" },
  noStatusTxt:     { fontSize: 13, color: "#aaa" },

  actionsCard:     { backgroundColor: "#fff", marginHorizontal: 14, marginBottom: 14, borderRadius: 18, padding: 18, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  actionsTitle:    { fontSize: 14, fontWeight: "700", color: "#444", marginBottom: 14 },
  actionBtns:      { flexDirection: "row", gap: 10 },
  actionBtn:       { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14 },
  actionEmoji:     { fontSize: 24, marginBottom: 6 },
  actionLabel:     { fontSize: 12, fontWeight: "700" },
  savingRow:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  savingTxt:       { color: "#888", fontSize: 13 },

  inactiveCard:    { backgroundColor: "#f5f5f5", marginHorizontal: 14, marginBottom: 14, borderRadius: 14, padding: 16, alignItems: "center" },
  inactiveTxt:     { color: "#888", fontSize: 13 },

  gpsCard:         { backgroundColor: "#fff", marginHorizontal: 14, marginBottom: 14, borderRadius: 18, padding: 18, shadowColor: "#000", shadowOpacity: 0.04, elevation: 1 },
  gpsBtn:          { backgroundColor: "#378ADD", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 4 },
  gpsBtnTxt:       { color: "#fff", fontWeight: "700", fontSize: 14 },
  locationResult:  { backgroundColor: "#f0faf7", borderRadius: 10, padding: 12, marginTop: 10 },
  locationTxt:     { fontSize: 13, fontWeight: "700", color: "#0F6E56", marginBottom: 4 },
  locationCoords:  { fontSize: 12, color: "#555", fontFamily: "monospace" },

  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard:       { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle:      { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  modalSub:        { fontSize: 13, color: "#888", marginBottom: 16 },
  noteInput:       { borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 14, padding: 14, fontSize: 14, color: "#1a1a1a", minHeight: 100, marginBottom: 16 },
  modalBtns:       { flexDirection: "row", gap: 12 },
  modalCancel:     { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 14, alignItems: "center" },
  modalCancelTxt:  { color: "#666", fontWeight: "600" },
  modalConfirm:    { flex: 1, backgroundColor: "#E24B4A", borderRadius: 12, padding: 14, alignItems: "center" },
  modalConfirmDisabled: { opacity: 0.4 },
  modalConfirmTxt: { color: "#fff", fontWeight: "700" },
});