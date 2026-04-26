import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image } from 'react-native';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';

const API = 'http://192.168.0.72/PhpFinalProject/api';

export default function LoginScreen() {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState('chauffeur');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Email et mot de passe requis.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user',  JSON.stringify(data.user));
        router.replace('/home');
      } else {
        setError(data.error || 'Email ou mot de passe incorrect.');
      }
    } catch {
      setError('Serveur inaccessible. Vérifiez votre connexion.');
    }
    setLoading(false);
  }

  async function handleRegister() {
    if (!name || !email || !password || !confirm) { setError('Tous les champs sont requis.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6)  { setError('Mot de passe trop court (min. 6 caractères).'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(' Compte créé', 'Vous pouvez maintenant vous connecter.', [
          { text: 'OK', onPress: () => { setMode('login'); setError(''); setName(''); setConfirm(''); } }
        ]);
      } else {
        setError(data.error || 'Erreur lors de la création du compte.');
      }
    } catch {
      setError('Serveur inaccessible. Vérifiez votre connexion.');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Image 
  source={require('../../assets/images/logo.png')} 
  style={{ width: 90, height: 90, borderRadius: 20 }}
  resizeMode="contain"
/>
          <Text style={s.appName}>CleanUp</Text>
          <Text style={s.tagline}>Pour un monde propre</Text>
        </View>

        {/* Tabs login / inscription */}
        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tab, mode==='login' && s.tabActive]}
            onPress={() => { setMode('login'); setError(''); }}
          >
            <Text style={[s.tabTxt, mode==='login' && s.tabTxtActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, mode==='register' && s.tabActive]}
            onPress={() => { setMode('register'); setError(''); }}
          >
            <Text style={[s.tabTxt, mode==='register' && s.tabTxtActive]}>S'inscrire</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>

          {/* Titre centré */}
          <Text style={s.cardTitle}>
            {mode==='login' ? 'Connexion' : 'Créer un compte'}
          </Text>

          {/* Champ nom (inscription seulement) */}
          {mode==='register' && (
            <>
              <Text style={s.label}>Nom complet</Text>
              <TextInput style={s.input} value={name} onChangeText={setName}
                placeholder="ex: Khalid Amrani" placeholderTextColor="#bbb" />
            </>
          )}

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="votre@email.ma" placeholderTextColor="#bbb"
            keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Mot de passe</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry />

          {/* Confirmation + rôle (inscription seulement) */}
          {mode==='register' && (
            <>
              <Text style={s.label}>Confirmer le mot de passe</Text>
              <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
                placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry />

              <Text style={s.label}>Rôle</Text>
              <View style={s.roleRow}>
                {['chauffeur'].map(r => (
                  <TouchableOpacity key={r} style={[s.roleBtn, role===r && s.roleBtnActive]}
                    onPress={() => setRole(r)}>
                    <Text style={[s.roleTxt, role===r && s.roleTxtActive]}>
                      {r==='chauffeur' ? ' Chauffeur' : '📋 Responsable'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>erreur{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={mode==='login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>{mode==='login' ? 'Se connecter →' : 'Créer mon compte →'}</Text>
            }
          </TouchableOpacity>

          {/* Lien bas de form */}
          <TouchableOpacity style={s.switchLink} onPress={()=>{ setMode(mode==='login'?'register':'login'); setError(''); }}>
            <Text style={s.switchTxt}>
              {mode==='login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GREEN = '#0F6E56';

const s = StyleSheet.create({
  container:    { flexGrow:1, backgroundColor:'#f0faf7', paddingHorizontal:24, paddingBottom:40 },
  header:       { alignItems:'center', paddingTop:70, paddingBottom:36 },
  logoCircle:   { width:80, height:80, borderRadius:24, backgroundColor:GREEN, alignItems:'center', justifyContent:'center', marginBottom:16, shadowColor:GREEN, shadowOpacity:0.4, shadowRadius:12, elevation:6 },
  logoEmoji:    { fontSize:40 },
  appName:      { fontSize:34, fontWeight:'900', color:GREEN, letterSpacing:-0.5 },
  tagline:      { fontSize:14, color:'#6b9e8f', marginTop:4 },

  tabs:         { flexDirection:'row', backgroundColor:'#e0f2ec', borderRadius:14, padding:4, marginBottom:20 },
  tab:          { flex:1, paddingVertical:10, alignItems:'center', borderRadius:11 },
  tabActive:    { backgroundColor:'#fff', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:6, elevation:2 },
  tabTxt:       { fontSize:14, fontWeight:'600', color:'#6b9e8f' },
  tabTxtActive: { color:GREEN, fontWeight:'800' },

  card:         { backgroundColor:'#fff', borderRadius:24, padding:24, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:16, elevation:4 },
  cardTitle:    { fontSize:24, fontWeight:'800', color:'#111', textAlign:'center', marginBottom:24 },
  label:        { fontSize:13, fontWeight:'600', color:'#444', marginBottom:6 },
  input:        { borderWidth:1.5, borderColor:'#e5e5e5', borderRadius:12, padding:14, fontSize:15, color:'#111', marginBottom:16, backgroundColor:'#fafafa' },

  roleRow:      { flexDirection:'row', gap:10, marginBottom:16 },
  roleBtn:      { flex:1, padding:12, borderRadius:12, borderWidth:1.5, borderColor:'#e5e5e5', alignItems:'center', backgroundColor:'#fafafa' },
  roleBtnActive:{ borderColor:GREEN, backgroundColor:'#e6f7f2' },
  roleTxt:      { fontSize:13, fontWeight:'600', color:'#888' },
  roleTxtActive:{ color:GREEN },

  errorBox:     { backgroundColor:'#fef2f2', borderRadius:10, padding:12, marginBottom:14 },
  errorTxt:     { color:'#dc2626', fontSize:13 },

  btn:          { backgroundColor:GREEN, borderRadius:14, padding:17, alignItems:'center', marginTop:4 },
  btnDisabled:  { backgroundColor:'#94a3b8' },
  btnTxt:       { color:'#fff', fontWeight:'800', fontSize:16 },

  switchLink:   { marginTop:18, alignItems:'center' },
  switchTxt:    { color:GREEN, fontSize:13, fontWeight:'600' },
});