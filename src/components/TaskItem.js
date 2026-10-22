import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { formatTime } from "../utils/dateUtils";

export default function TaskItem({ task, done, onToggle, onEdit, onDelete }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onToggle}>
        <Text style={[styles.title, done && styles.done]}>
          {done ? "✅ " : "⬜ "}
          {task.title}
        </Text>
        <Text style={styles.meta}>
          {task.repeat === "daily" ? "🔁 Daily  " : ""}
          {task.time ? `⏰ ${formatTime(task.time)}` : ""}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onEdit}>
        <Text style={styles.icon}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete}>
        <Text style={styles.icon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 16 },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  done: { textDecorationLine: "line-through", color: "#999" },
  icon: { fontSize: 20, paddingLeft: 12 },
});