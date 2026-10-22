import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR } from "../constants/colors";
import { formatTime } from "../utils/dateUtils";

const BADGES = {
  done: { label: "✅ Completed", style: "badgeDone" },
  moved: { label: "📅 Rescheduled", style: "badgeMoved" },
  missed: { label: "❌ Missed", style: "badgeMissed" },
};

export default function PastTaskItem({
  task,
  status,
  onMarkDone,
  onReschedule,
  panel,
}) {
  const badge = BADGES[status];

  return (
    <View style={styles.item}>
      <Text style={[styles.title, status === "done" && styles.done]}>
        {task.title}
      </Text>
      <Text style={styles.meta}>
        {task.repeat === "daily" ? "🔁 Daily  " : ""}
        {task.time ? `⏰ ${formatTime(task.time)}` : ""}
      </Text>

      <Text style={[styles.badge, styles[badge.style]]}>{badge.label}</Text>

      {status === "missed" && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={onMarkDone}>
            <Text style={styles.action}>✅ Mark done</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onReschedule}>
            <Text style={styles.action}>📅 Reschedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {panel}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 16 },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  done: { textDecorationLine: "line-through", color: "#999" },
  badge: { alignSelf: "flex-start", fontSize: 12, fontWeight: "600", borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, marginTop: 6, overflow: "hidden" },
  badgeDone: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeMissed: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  badgeMoved: { backgroundColor: "#e0e7ff", color: "#3730a3" },
  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  action: { color: COLOR, fontWeight: "600", marginRight: 16, marginBottom: 4 },
});