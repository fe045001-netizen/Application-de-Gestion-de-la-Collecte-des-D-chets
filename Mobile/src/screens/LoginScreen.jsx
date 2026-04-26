import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { login, register } from "../utils/api";

export default function LoginScreen({ onLogin }) {
  const [mode,     setMode]     = useState("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Email et mot de passe requis."); return; }
    if (mode === "register" && !name) { setError("Nom requis."); return; }
    setLoading(true);
    setError("");

    const { ok, data, error: err } = mode === "login"
      ? await login(email, password)
      : await register(name, email, password);

    setLoading(false);

    if (!ok) { setError(err || "Échec de connexion"); return; }

    // Sauvegarder token + user
    if (data.token) await AsyncStorage.setItem("token", data.token);
    const user = data.user || { id: data.id, name: data.name || name, email, role: "chauffeur" };
    await AsyncStorage.setItem("user", JSON.stringify(user));
    onLogin(user);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🗑️</Text>
          </View>
          <Text style={styles.appName}>CollecteMaroc</Text>
          <Text style={styles.appSub}>Application chauffeur</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Toggle */}
          <View style={styles.toggle}>
            {["login", "register"].map(m => (
              <TouchableOpacity key={m} onPress={() => { setMode(m); setError(""); }}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}>
                <Text style={[styles.toggleTxt, mode === m && styles.toggleTxtActive]}>
                  {m === "login" ? "Connexion" : "S'inscrire"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Champs */}
          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName}
                placeholder="ex: Ahmed Benali" placeholderTextColor="#bbb" />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="vous@example.com" placeholderTextColor="#bbb"
              keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>Erreur {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnTxt}>{mode === "login" ? "Se connecter" : "Créer mon compte"}</Text>
            }
          </TouchableOpacity>

          {/* Comptes demo */}
          {mode === "login" && (
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Compte de démo :</Text>
              <TouchableOpacity onPress={() => { setEmail("chauffeur@collecte.ma"); setPassword("chauffeur123"); }}>
                <Text style={styles.demoLink}>chauffeur@collecte.ma / chauffeur123</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0F6E56",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoEmoji: { fontSize: 38 },
  appName:  { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  appSub:   { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  card: {
    width: "100%", maxWidth: 400,
    backgroundColor: "#fff", borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  toggle: {
    flexDirection: "row", backgroundColor: "#f5f5f5",
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  toggleBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleTxt: { fontSize: 14, color: "#888", fontWeight: "500" },
  toggleTxtActive: { color: "#0F6E56", fontWeight: "700" },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 7 },
  input: {
    borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 12,
    padding: 13, fontSize: 14, color: "#1a1a1a",
  },
  errorBox: { backgroundColor: "#FCEBEB", borderRadius: 10, padding: 12, marginBottom: 14 },
  errorTxt: { color: "#A32D2D", fontSize: 13 },
  btn: {
    backgroundColor: "#0F6E56", borderRadius: 14,
    padding: 15, alignItems: "center", marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
  demoBox: { marginTop: 20, padding: 14, backgroundColor: "#f0faf7", borderRadius: 12 },
  demoTitle: { fontSize: 12, fontWeight: "700", color: "#0F6E56", marginBottom: 4 },
  demoLink: { fontSize: 12, color: "#1D9E75" },
});