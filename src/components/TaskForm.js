import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR } from "../constants/colors";
import TimeField from "./TimeField";

export default function TaskForm({
  isEditing,
  text,
  time,
  repeatDaily,
  error,
  onTextChange,
  onTimeChange,
  onToggleRepeat,
  onSubmit,
  onClose,
}) {
  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? "✏️ Edit task" : "New task"}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.clear}>✕ {isEditing ? "Cancel" : "Close"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Task name..."
          value={text}
          onChangeText={onTextChange}
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity style={styles.addBtn} onPress={onSubmit}>
          <Text style={styles.addText}>{isEditing ? "Save" : "Add"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>⏰ Time (optional)</Text>
        <TimeField value={time} onChange={onTimeChange} />
        {time !== "" && (
          <TouchableOpacity onPress={() => onTimeChange("")}>
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.repeatChip, repeatDaily && styles.repeatChipActive]}
        onPress={onToggleRepeat}
      >
        <Text style={repeatDaily ? styles.repeatTextActive : styles.repeatText}>
          🔁 Repeat daily {repeatDaily ? "(on)" : ""}
        </Text>
      </TouchableOpacity>

      {error !== "" && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  clear: { color: COLOR, marginLeft: 10, fontWeight: "600" },
  addRow: { flexDirection: "row", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginRight: 8 },
  addBtn: { backgroundColor: COLOR, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "bold" },
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  timeLabel: { marginRight: 10, color: "#555" },
  repeatChip: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#ccc", borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 8 },
  repeatChipActive: { backgroundColor: COLOR, borderColor: COLOR },
  repeatText: { color: "#333" },
  repeatTextActive: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 8 },
});