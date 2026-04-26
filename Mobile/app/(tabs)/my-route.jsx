import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API = 'http://192.168.0.72/PhpFinalProject/api';

async function apiFetch(endpoint, token, method='GET', body=null) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  try { return { ok:res.ok, data:JSON.parse(text) }; }
  catch { return { ok:false, data:null }; }
}

const STATUS_CFG = {
  collecté:     { label:'Collecté',     bg:'#E1F5EE', color:'#0F6E56', dot:'#1D9E75' },
  non_collecté: { label:'Non collecté', bg:'#FAEEDA', color:'#854F0B', dot:'#EF9F27' },
  problème:     { label:'Incident',     bg:'#FCEBEB', color:'#A32D2D', dot:'#E24B4A' },
};

export default function MyRouteScreen() {
  const { routeId } = useLocalSearchParams();
  const [route,     setRoute]     = useState(null);
  const [points,    setPoints]    = useState([]);
  const [logs,      setLogs]      = useState([]);
  const [token,     setToken]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [savingId,  setSavingId]  = useState(null);
  // Modal note problème
  const [noteModal,  setNoteModal]  = useState(false);
  const [notePoint,  setNotePoint]  = useState(null);
  const [noteText,   setNoteText]   = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const tok = await AsyncStorage.getItem('token');
    setToken(tok);
    await loadData(tok);
    setLoading(false);
  }

  async function loadData(tok) {
    const [rR, rP, rL] = await Promise.all([
      apiFetch('/routes', tok),
      apiFetch('/points', tok),
      apiFetch('/logs',   tok),
    ]);
    if (rR.ok) {
      const r = rR.data.find(r=>String(r.id)===String(routeId));
      setRoute(r || null);
    }
    if (rP.ok) {
      const pts = rP.data
        .map(p=>({...p, routeId:p.route_id||p.routeId}))
        .filter(p=>String(p.routeId)===String(routeId));
      setPoints(pts);
    }
    if (rL.ok) {
      setLogs(rL.data.map(l=>({
        ...l,
        pointId: l.point_id||l.pointId,
        routeId: l.route_id||l.routeId,
      })));
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData(token);
    setRefreshing(false);
  }

  function getLog(pointId) {
    return logs.find(l=>String(l.pointId)===String(pointId)&&String(l.routeId)===String(routeId));
  }

  async function markPoint(point, status, note='') {
    const existing = getLog(point.id);
    if (existing?.status==='collecté' && status==='collecté') {
      Alert.alert('Déjà collecté', 'Ce point est déjà marqué comme collecté.');
      return;
    }
    setSavingId(point.id);

    if (existing) {
      const { ok } = await apiFetch(`/logs/${existing.id}`, token, 'PUT', { status, note });
      if (ok) {
        setLogs(prev=>prev.map(l=>l.id===existing.id ? {...l,status,note,timestamp:new Date().toISOString()} : l));
      } else { Alert.alert('Erreur', 'Impossible de modifier le statut.'); }
    } else {
      const { ok, data } = await apiFetch('/logs', token, 'POST', {
        point_id: parseInt(point.id),
        route_id: parseInt(routeId),
        status, note,
      });
      if (ok) {
        setLogs(prev=>[...prev,{
          id:data?.id||Date.now(),
          pointId:parseInt(point.id),
          routeId:parseInt(routeId),
          status, note,
          timestamp:new Date().toISOString(),
        }]);
      } else { Alert.alert('Erreur', 'Impossible d\'enregistrer.'); }
    }
    setSavingId(null);
  }

  function openNoteModal(point) {
    setNotePoint(point);
    setNoteText('');
    setNoteModal(true);
  }

  async function submitNote() {
    if (!noteText.trim()) { Alert.alert('Note requise', 'Décrivez le problème.'); return; }
    setNoteSaving(true);
    await markPoint(notePoint, 'problème', noteText.trim());
    setNoteSaving(false);
    setNoteModal(false);
  }

  if (loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#f7f8fa'}}>
        <ActivityIndicator size="large" color="#0F6E56" />
      </View>
    );
  }

  const isActive   = route?.status === 'en_cours';
  const collected  = points.filter(p=>getLog(p.id)?.status==='collecté').length;
  const pct        = points.length ? Math.round(collected/points.length*100) : 0;
  const barColor   = pct===100?'#1D9E75':pct>=50?'#EF9F27':'#E24B4A';

  // Résumé zones
  const zones = {};
  points.forEach(p=>{
    if(!p.zone) return;
    if(!zones[p.zone]) zones[p.zone]={total:0,done:0};
    zones[p.zone].total++;
    if(getLog(p.id)?.status==='collecté') zones[p.zone].done++;
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
<TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
  <Text style={s.backText}>← Retour</Text>
</TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{route?.name || 'Tournée'}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={{color:'rgba(255,255,255,0.8)',fontSize:20}}>Actualiser</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F6E56"/>}>
        {/* Progression */}
        <View style={s.progressCard}>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{collected}/{points.length} points collectés</Text>
            <Text style={[s.progressPct,{color:barColor}]}>{pct}%</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill,{width:`${pct}%`,backgroundColor:barColor}]}/>
          </View>
          {!isActive && (
            <Text style={{fontSize:12,color:'#888',marginTop:8,textAlign:'center'}}>
              {route?.status==='terminée' ? ' Tournée terminée' : ' Tournée planifiée — pas encore démarrée'}
            </Text>
          )}
        </View>

        {/* Résumé zones */}
        {Object.keys(zones).length>0 && (
          <View style={s.zonesCard}>
            <Text style={s.zonesTitle}>PAR ZONE</Text>
            <View style={s.zonesRow}>
              {Object.entries(zones).map(([zone,{total,done}])=>{
                const c=done===total?'#1D9E75':done>0?'#EF9F27':'#888';
                return (
                  <View key={zone} style={s.zoneBox}>
                    <Text style={s.zoneLabel}>{zone}</Text>
                    <Text style={[s.zoneVal,{color:c}]}>{done}/{total}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Liste points */}
        <Text style={s.sectionTitle}>Points de collecte ({points.length})</Text>

        {points.length===0 ? (
          <View style={s.emptyCard}>
            <Text style={{fontSize:28,marginBottom:8}}>Points</Text>
            <Text style={{color:'#888',textAlign:'center'}}>Aucun point assigné à cette tournée.</Text>
          </View>
        ) : points.map((p,i)=>{
          const log     = getLog(p.id);
          const isSaving= savingId===p.id;
          const st      = log ? STATUS_CFG[log.status] : null;
          const rowBg   = log?.status==='collecté'?'#f0faf7':log?.status==='problème'?'#fff9f9':'#fff';

          return (
            <View key={p.id} style={[s.pointCard,{backgroundColor:rowBg}]}>
              <View style={s.pointHeader}>
                <View style={s.pointNum}>
                  <Text style={s.pointNumText}>{i+1}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={s.pointName}>{p.name}</Text>
                  <Text style={s.pointMeta}>{[p.zone,p.type].filter(Boolean).join(' • ')}</Text>
                  {log?.note && <Text style={s.pointNote}> {log.note}</Text>}
                  {log?.timestamp && (
                    <Text style={s.pointTime}>
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                    </Text>
                  )}
                </View>
                {st && (
                  <View style={[s.statusBadge,{backgroundColor:st.bg}]}>
                    <View style={[s.statusDot,{backgroundColor:st.dot}]}/>
                    <Text style={[s.statusText,{color:st.color}]}>{st.label}</Text>
                  </View>
                )}
              </View>

              {/* Boutons action — seulement si tournée en cours */}
              {isActive && (
                <View style={s.actionRow}>
                  {isSaving ? (
                    <ActivityIndicator color="#0F6E56" style={{paddingVertical:8}}/>
                  ) : (
                    <>
                      <TouchableOpacity style={[s.actionBtn,s.collectBtn,log?.status==='collecté'&&s.actionBtnActive]}
                        onPress={()=>markPoint(p,'collecté')}>
                        <Text style={s.actionBtnText}> Collecté</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn,s.skipBtn,log?.status==='non_collecté'&&s.actionBtnActive]}
                        onPress={()=>markPoint(p,'non_collecté')}>
                        <Text style={s.actionBtnText}> Passé</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn,s.problemBtn,log?.status==='problème'&&s.actionBtnActive]}
                        onPress={()=>openNoteModal(p)}>
                        <Text style={s.actionBtnText}> Problème</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{height:32}}/>
      </ScrollView>

      {/* Modal problème */}
      <Modal visible={noteModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}> Signaler un problème</Text>
            <Text style={s.modalSub}>{notePoint?.name}</Text>
            <TextInput
              style={s.modalInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Décrivez le problème : bac plein, accès bloqué..."
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={()=>setNoteModal(false)} disabled={noteSaving}>
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalConfirmBtn,noteSaving&&{opacity:0.6}]} onPress={submitNote} disabled={noteSaving}>
                {noteSaving
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Text style={s.modalConfirmText}>Signaler</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#f7f8fa' },
  header:          { backgroundColor:'#0F6E56', padding:20, paddingTop:52, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  backBtn:         { padding:4 },
  backText:        { color:'#fff', fontSize:14, fontWeight:'600' },
  headerTitle:     { color:'#fff', fontSize:17, fontWeight:'700', flex:1, textAlign:'center', marginHorizontal:8 },
  progressCard:    { backgroundColor:'#fff', margin:16, borderRadius:16, padding:18, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:8, elevation:2 },
  progressRow:     { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  progressLabel:   { fontSize:14, color:'#555', fontWeight:'600' },
  progressPct:     { fontSize:14, fontWeight:'800' },
  progressBar:     { backgroundColor:'#f0f0f0', borderRadius:8, height:10, overflow:'hidden' },
  progressFill:    { height:'100%', borderRadius:8 },
  zonesCard:       { backgroundColor:'#fff', marginHorizontal:16, marginBottom:8, borderRadius:14, padding:14 },
  zonesTitle:      { fontSize:11, fontWeight:'700', color:'#aaa', letterSpacing:1, marginBottom:10 },
  zonesRow:        { flexDirection:'row', flexWrap:'wrap', gap:8 },
  zoneBox:         { borderWidth:1, borderColor:'#eee', borderRadius:10, padding:10, alignItems:'center', minWidth:64 },
  zoneLabel:       { fontSize:11, color:'#888' },
  zoneVal:         { fontSize:18, fontWeight:'800', marginTop:2 },
  sectionTitle:    { fontSize:15, fontWeight:'700', color:'#111', paddingHorizontal:16, marginBottom:10 },
  emptyCard:       { backgroundColor:'#fff', borderRadius:16, padding:32, margin:16, alignItems:'center' },
  pointCard:       { borderRadius:16, marginHorizontal:16, marginBottom:10, padding:16, shadowColor:'#000', shadowOpacity:0.03, shadowRadius:6, elevation:1 },
  pointHeader:     { flexDirection:'row', alignItems:'flex-start', gap:12 },
  pointNum:        { width:28, height:28, borderRadius:14, backgroundColor:'#f0faf7', justifyContent:'center', alignItems:'center', flexShrink:0 },
  pointNumText:    { fontSize:13, fontWeight:'700', color:'#0F6E56' },
  pointName:       { fontSize:15, fontWeight:'700', color:'#111' },
  pointMeta:       { fontSize:12, color:'#999', marginTop:2 },
  pointNote:       { fontSize:12, color:'#E24B4A', marginTop:4 },
  pointTime:       { fontSize:11, color:'#ccc', marginTop:2 },
  statusBadge:     { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:5, borderRadius:20, flexShrink:0 },
  statusDot:       { width:6, height:6, borderRadius:3 },
  statusText:      { fontSize:11, fontWeight:'700' },
  actionRow:       { flexDirection:'row', gap:8, marginTop:14 },
  actionBtn:       { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center', borderWidth:1.5 },
  collectBtn:      { backgroundColor:'#E1F5EE', borderColor:'#d1fae5' },
  skipBtn:         { backgroundColor:'#FAEEDA', borderColor:'#fde68a' },
  problemBtn:      { backgroundColor:'#FCEBEB', borderColor:'#fecaca' },
  actionBtnActive: { borderWidth:2.5 },
  actionBtnText:   { fontSize:12, fontWeight:'700', color:'#333' },
  modalOverlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalCard:       { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40 },
  modalTitle:      { fontSize:18, fontWeight:'700', color:'#111', marginBottom:4 },
  modalSub:        { fontSize:13, color:'#888', marginBottom:16 },
  modalInput:      { borderWidth:1.5, borderColor:'#e5e7eb', borderRadius:12, padding:14, fontSize:14, color:'#111', minHeight:100, marginBottom:16 },
  modalBtns:       { flexDirection:'row', gap:12 },
  modalCancelBtn:  { flex:1, padding:14, borderRadius:12, borderWidth:1, borderColor:'#e5e7eb', alignItems:'center' },
  modalCancelText: { fontWeight:'600', color:'#666' },
  modalConfirmBtn: { flex:1, padding:14, borderRadius:12, backgroundColor:'#E24B4A', alignItems:'center' },
  modalConfirmText:{ fontWeight:'700', color:'#fff' },
});