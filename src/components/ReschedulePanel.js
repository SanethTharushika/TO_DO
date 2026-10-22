import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR } from "../constants/colors";
import DateField from "./DateField";
import TimeField from "./TimeField";

export default function ReschedulePanel({
  date,
  time,
  error,
  onDateChange,
  onTimeChange,
  onSave,
  onCancel,
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>📅 Reschedule to</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Date</Text>
        <DateField value={date} onChange={onDateChange} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>⏰ Time</Text>
        <TimeField value={time} onChange={onTimeChange} />
        {time !== "" && (
          <TouchableOpacity onPress={() => onTimeChange("")}>
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: "#f5f3ff", borderRadius: 12, padding: 12, marginTop: 10 },
  title: { fontSize: 15, fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  label: { marginRight: 10, color: "#555" },
  clear: { color: COLOR, marginLeft: 10, fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 8 },
  actions: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  saveBtn: { backgroundColor: COLOR, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, justifyContent: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
  cancel: { color: COLOR, fontWeight: "600", marginLeft: 16 },
});