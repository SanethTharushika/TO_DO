import { View, Text, StyleSheet } from "react-native";
import { COLOR, GREEN, RED, AMBER } from "../constants/colors";

export default function ProgressCard({ stats, isToday }) {
  if (stats.total === 0) return null;

  const color =
    stats.percent === 100
      ? GREEN
      : isToday
      ? COLOR
      : stats.percent === 0
      ? RED
      : AMBER;

  const eachTask = Math.round(100 / stats.total);
  const exact = 100 % stats.total === 0;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={[styles.percent, { color }]}>{stats.percent}%</Text>
        <Text style={styles.text}>
          {stats.done} of {stats.total} {stats.total === 1 ? "task" : "tasks"}{" "}
          completed
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${stats.percent}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.hint}>
        Each task {exact ? "=" : "≈"} {eachTask}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  percent: { fontSize: 28, fontWeight: "bold", marginRight: 10 },
  text: { color: "#555", fontSize: 14 },
  track: { height: 8, borderRadius: 4, backgroundColor: "#e5e7eb", overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  hint: { color: "#888", fontSize: 12, marginTop: 6 },
});