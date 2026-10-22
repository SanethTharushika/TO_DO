import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR } from "../constants/colors";
import { dayLabel, formatTime } from "../utils/dateUtils";

export default function MissedBox({
  tasks,
  today,
  onDone,
  onReschedule,
  onDelete,
  renderPanel,
}) {
  if (tasks.length === 0) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>⚠️ Missed ({tasks.length})</Text>

      {tasks.map((t) => {
        const occ = t.repeat === "daily" ? today : t.date;
        return (
          <View key={t.id} style={styles.row}>
            <Text style={styles.text}>{t.title}</Text>
            <Text style={styles.meta}>
              {t.repeat === "daily" ? "🔁 " : ""}
              {dayLabel(occ)}
              {t.time ? ` · ${formatTime(t.time)}` : ""}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onDone(t, occ)}>
                <Text style={styles.action}>✅ Done</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onReschedule(t, occ)}>
                <Text style={styles.action}>📅 Reschedule</Text>
              </TouchableOpacity>
              {t.repeat !== "daily" && (
                <TouchableOpacity onPress={() => onDelete(t.id)}>
                  <Text style={styles.action}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>

            {renderPanel(t, occ)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "bold", color: "#b91c1c", marginBottom: 8 },
  row: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#fecaca" },
  text: { fontSize: 16, color: "#7f1d1d" },
  meta: { fontSize: 12, color: "#b91c1c", marginTop: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  action: { color: COLOR, fontWeight: "600", marginRight: 16, marginBottom: 4 },
});