import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR } from "../constants/colors";
import { formatTime } from "../utils/dateUtils";

export default function ReminderAlerts({ alerts, onDismiss }) {
  return (
    <>
      {alerts.map((a) => (
        <View key={a.key} style={styles.box}>
          <Text style={styles.text}>
            ⏰ {a.title} — {formatTime(a.time)}
          </Text>
          <TouchableOpacity onPress={() => onDismiss(a.key)}>
            <Text style={styles.close}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef3c7", borderRadius: 12, padding: 12, marginBottom: 8 },
  text: { flex: 1, fontWeight: "600", color: "#92400e" },
  close: { color: COLOR, fontWeight: "600", marginLeft: 10 },
});