import { Text, View } from "react-native";

const CONFIG = {
  collecté:     { label: "Collecté",     bg: "#D4F5E2", color: "#0F6E56", dot: "#1D9E75" },
  non_collecté: { label: "Non collecté", bg: "#FAEEDA", color: "#854F0B", dot: "#EF9F27" },
  problème:     { label: "Incident",     bg: "#FCEBEB", color: "#A32D2D", dot: "#E24B4A" },
  actif:        { label: "Actif",        bg: "#E6F1FB", color: "#185FA5", dot: "#378ADD" },
  en_cours:     { label: "En cours",     bg: "#D4F5E2", color: "#0F6E56", dot: "#1D9E75" },
  planifiée:    { label: "Planifiée",    bg: "#FAEEDA", color: "#854F0B", dot: "#EF9F27" },
  terminée:     { label: "Terminée",     bg: "#F1EFE8", color: "#5F5E5A", dot: "#888780" },
};

export default function StatusBadge({ status, size = "md" }) {
  const cfg = CONFIG[status] || { label: status, bg: "#f0f0f0", color: "#666", dot: "#aaa" };
  const fontSize = size === "sm" ? 10 : 12;
  const padding  = size === "sm" ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 10, paddingVertical: 4 };
  const dotSize  = size === "sm" ? 5 : 7;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: cfg.bg, borderRadius: 20, ...padding, alignSelf: "flex-start" }}>
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: cfg.dot, marginRight: 5 }} />
      <Text style={{ color: cfg.color, fontSize, fontWeight: "600" }}>{cfg.label}</Text>
    </View>
  );
}