const BASE_URL = "http://192.168.0.72/PhpFinalProject/api";

async function apiFetch(endpoint, method = "GET", body = null) {
  const token = await getToken();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return { ok: false, error: "Réponse invalide" }; }
    return { ok: res.ok, data, error: res.ok ? null : (data?.error || `Erreur ${res.status}`) };
  } catch (e) {
    return { ok: false, error: "Réseau: " + e.message };
  }
}

async function getToken() {
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return await AsyncStorage.getItem("token");
  } catch { return null; }
}

export const getRoutes = () => apiFetch("/routes");
export const getPoints = () => apiFetch("/points");
export const getLogs   = () => apiFetch("/logs");
export const getTrucks = () => apiFetch("/trucks");

export const createLog = (body)      => apiFetch("/logs",       "POST", body);
export const updateLog = (id, body)  => apiFetch(`/logs/${id}`, "PUT",  body);
export const login     = (body)      => apiFetch("/login",      "POST", body);

export async function sendPosition(userId, userName, lat, lng, routeId = null) {
  try {
    const res = await fetch(`${BASE_URL}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:   userId,
        user_name: userName,
        lat, lng,
        route_id:  routeId,
      }),
    });
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}