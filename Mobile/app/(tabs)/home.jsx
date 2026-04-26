import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
} from 'react-native';

const API = 'http://192.168.0.72/PhpFinalProject/api';

async function apiFetch(endpoint, token) {
  const res  = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return []; }
}

async function sendPosition(userId, userName, lat, lng, routeId) {
  try {
    await fetch(`${API}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_name: userName, lat, lng, route_id: routeId }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false };
  }
}

export default function HomeScreen() {
  const [user,       setUser]       = useState(null);
  const [routes,     setRoutes]     = useState([]);
  const [logs,       setLogs]       = useState([]);
  const [points,     setPoints]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // GPS
  const [gpsActive,  setGpsActive]  = useState(false);
  const [gpsStatus,  setGpsStatus]  = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [lastPos,    setLastPos]    = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function init() {
    const token = await AsyncStorage.getItem('token');
    const usr   = JSON.parse(await AsyncStorage.getItem('user') || '{}');
    setUser(usr);
    await loadData(token, usr);
    setLoading(false);
  }

  async function loadData(token, usr) {
    if (!token) return;
    const [rR, rL, rP] = await Promise.all([
      apiFetch('/routes', token),
      apiFetch('/logs',   token),
      apiFetch('/points', token),
    ]);
    const uid       = parseInt(usr?.id);
    const allRoutes = Array.isArray(rR) ? rR.map(r => ({
      ...r, truckId: r.truck_id || r.truckId, driverId: r.driver_id || r.driverId,
    })) : [];
    setRoutes(allRoutes.filter(r => parseInt(r.driverId) === uid));
    setLogs(Array.isArray(rL) ? rL.map(l => ({
      ...l, pointId: l.point_id || l.pointId, routeId: l.route_id || l.routeId,
    })) : []);
    setPoints(Array.isArray(rP) ? rP.map(p => ({
      ...p, routeId: p.route_id || p.routeId,
    })) : []);
  }

  async function onRefresh() {
    setRefreshing(true);
    const token = await AsyncStorage.getItem('token');
    await loadData(token, user);
    setRefreshing(false);
  }

  async function logout() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await AsyncStorage.clear();
    router.replace('/(tabs)/login');
  }

  // ── GPS ──────────────────────────────────────────────────────────────────
  const activeRoute = routes.find(r => r.status === 'en_cours');

  async function doSend() {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setLastPos({ lat: latitude, lng: longitude, time: new Date() });
      const res = await sendPosition(
        user?.id, user?.name || user?.email,
        latitude, longitude, activeRoute?.id || null
      );
      setGpsStatus(res.ok ? ' Position envoyée' : ' Erreur envoi');
    } catch {
      setGpsStatus(' Impossible d\'obtenir la position');
    }
  }

  async function toggleGps() {
    if (gpsActive) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setGpsActive(false);
      setGpsStatus('Partage arrêté');
      return;
    }
    setGpsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGpsLoading(false);
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorisez la localisation dans les paramètres.');
      return;
    }
    setGpsActive(true);
    setGpsStatus('Démarrage...');
    await doSend();
    intervalRef.current = setInterval(doSend, 30000);
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f8fa' }}>
        <ActivityIndicator size="large" color="#0F6E56" />
        <Text style={{ marginTop: 16, color: '#888' }}>Chargement...</Text>
      </View>
    );
  }

  const activeRoutes   = routes.filter(r => r.status === 'en_cours');
  const myLogs         = logs.filter(l => routes.some(r => parseInt(r.id) === parseInt(l.routeId)));
  const totalCollected = myLogs.filter(l => l.status === 'collecté').length;
  const totalIncidents = myLogs.filter(l => l.status === 'problème').length;
  const totalPoints    = points.filter(p => routes.some(r => parseInt(r.id) === parseInt(p.routeId))).length;

  return (
    <ScrollView style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F6E56" />}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Bonjour </Text>
          <Text style={s.name}>{user?.name || user?.email}</Text>
          <Text style={s.role}> Chauffeur</Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* ── Carte GPS ─────────────────────────────────────────────────────── */}
      <View style={s.gpsCard}>
        <View style={s.gpsRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.gpsTitle}> Partage de position GPS</Text>
            <Text style={s.gpsSub}>
              {gpsActive
                ? 'Position envoyée toutes les 30 secondes au responsable'
                : 'Désactivé — activez pour partager votre position'}
            </Text>
           
            {lastPos && (
              <Text style={s.gpsCoords}>
                 {lastPos.lat.toFixed(5)}, {lastPos.lng.toFixed(5)}
                {'  '}{lastPos.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          {gpsLoading
            ? <ActivityIndicator color="#0F6E56" />
            : <Switch
                value={gpsActive}
                onValueChange={toggleGps}
                trackColor={{ false: '#ddd', true: '#1D9E75' }}
                thumbColor={gpsActive ? '#0F6E56' : '#f4f3f4'}
              />
          }
        </View>
        {gpsActive && (
          <TouchableOpacity onPress={doSend} style={s.gpsSendBtn}>
            <Text style={s.gpsSendTxt}>📤 Envoyer maintenant</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Stats */}
      <View style={s.statsGrid}>
        {[
          { value: activeRoutes.length,   label: 'Tournées actives', color: '#1D9E75' },
          { value: totalPoints,           label: 'Points assignés',  color: '#378ADD' },
          { value: totalCollected,        label: 'Collectés',        color: '#1D9E75' },
          { value: totalIncidents,        label: 'Incidents',        color: totalIncidents > 0 ? '#E24B4A' : '#aaa' },
        ].map(s2 => (
          <View key={s2.label} style={[s.statCard, { borderLeftColor: s2.color }]}>
            <Text style={[s.statValue, { color: s2.color }]}>{s2.value}</Text>
            <Text style={s.statLabel}>{s2.label}</Text>
          </View>
        ))}
      </View>

      {/* Tournées */}
      <Text style={s.sectionTitle}>Mes tournées ({routes.length})</Text>
      {routes.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={{ color: '#888', textAlign: 'center' }}>Aucune tournée assignée.</Text>
          <Text style={{ color: '#bbb', fontSize: 12, marginTop: 4, textAlign: 'center' }}>Contactez votre responsable.</Text>
        </View>
      ) : routes.map(route => {
        const rPoints  = points.filter(p => parseInt(p.routeId) === parseInt(route.id));
        const rLogs    = logs.filter(l => parseInt(l.routeId) === parseInt(route.id));
        const done     = rLogs.filter(l => l.status === 'collecté').length;
        const pct      = rPoints.length ? Math.round(done / rPoints.length * 100) : 0;
        const STATUS   = {
          en_cours:  { bg: '#E1F5EE', color: '#0F6E56', label: 'En cours' },
          planifiée: { bg: '#FAEEDA', color: '#854F0B', label: 'Planifiée' },
          terminée:  { bg: '#f0f0f0', color: '#888',    label: 'Terminée' },
        };
        const st       = STATUS[route.status] || STATUS.planifiée;
        const barColor = pct === 100 ? '#1D9E75' : pct >= 50 ? '#EF9F27' : '#E24B4A';

        return (
          <TouchableOpacity key={route.id} style={s.routeCard}
            onPress={() => router.push({
              pathname: '/(tabs)/my-route',
              params: { routeId: route.id, userId: user?.id, userName: user?.name || user?.email }
            })}>
            <View style={s.routeHeader}>
              <Text style={s.routeName}>{route.name}</Text>
              <View style={[s.badge, { backgroundColor: st.bg }]}>
                <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
            <Text style={s.routeDate}>{route.date ? new Date(route.date).toLocaleDateString('fr-FR') : '—'}</Text>
            <View style={s.progressRow}>
              <Text style={s.progressText}>{done}/{rPoints.length} collectés</Text>
              <Text style={[s.progressPct, { color: barColor }]}>{pct}%</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={s.routeArrow}>Voir les points →</Text>
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f8fa' },
  header:       { backgroundColor: '#0F6E56', padding: 24, paddingTop: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:     { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  name:         { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  role:         { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  logoutBtn:    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoutText:   { color: '#fff', fontSize: 13, fontWeight: '600' },

  // GPS
  gpsCard:      { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e8f5ef', elevation: 2 },
  gpsRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpsTitle:     { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  gpsSub:       { fontSize: 12, color: '#999', lineHeight: 18 },
  gpsStatusTxt: { fontSize: 12, fontWeight: '600', marginTop: 5 },
  gpsCoords:    { fontSize: 11, color: '#aaa', marginTop: 3 },
  gpsSendBtn:   { marginTop: 12, backgroundColor: '#E1F5EE', borderRadius: 10, padding: 11, alignItems: 'center' },
  gpsSendTxt:   { color: '#0F6E56', fontWeight: '700', fontSize: 13 },

  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderLeftWidth: 4, elevation: 2 },
  statValue:    { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 4 },
  statLabel:    { fontSize: 12, color: '#888' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', paddingHorizontal: 16, marginBottom: 12 },
  emptyCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 32, margin: 16, alignItems: 'center' },
  routeCard:    { backgroundColor: '#fff', borderRadius: 16, margin: 16, marginTop: 0, padding: 18, elevation: 2 },
  routeHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  routeName:    { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  routeDate:    { fontSize: 12, color: '#999', marginBottom: 10 },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, color: '#888' },
  progressPct:  { fontSize: 12, fontWeight: '700' },
  progressBar:  { backgroundColor: '#f0f0f0', borderRadius: 8, height: 6, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 8 },
  routeArrow:   { fontSize: 13, color: '#0F6E56', fontWeight: '600' },
});