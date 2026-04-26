import { Text, TouchableOpacity, View } from "react-native";
import StatusBadge from "./StatusBadge";

export default function PointCard({ point, log, index, onPress }) {
  const statusColor = {
    collecté:     "#1D9E75",
    non_collecté: "#EF9F27",
    problème:     "#E24B4A",
  }[log?.status] || "#ddd";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        {/* Numéro */}
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#f0faf7", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#0F6E56" }}>{index + 1}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1a1a1a" }}>{point.name}</Text>
          <Text style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
            {[point.zone, point.type].filter(Boolean).join(" • ")}
          </Text>
        </View>

        {log && <StatusBadge status={log.status} size="sm" />}
      </View>

      {log?.note ? (
        <View style={{ backgroundColor: "#fff5f5", borderRadius: 8, padding: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: "#E24B4A" }}> {log.note}</Text>
        </View>
      ) : null}

      {log?.timestamp ? (
        <Text style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>
          {new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      ) : null}

      {!log && (
        <Text style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Appuyez pour marquer ce point</Text>
      )}
    </TouchableOpacity>
  );
}