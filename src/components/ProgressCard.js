import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ProgressCard({ stats, isToday }) {
  const { colors } = useTheme();

  if (stats.total === 0) return null;

  // green = all done, accent = today in progress, red = nothing done, orange = partly done
  const color =
    stats.percent === 100
      ? colors.success
      : isToday
      ? colors.link
      : stats.percent === 0
      ? colors.danger
      : colors.warning;

  const eachTask = Math.round(100 / stats.total);
  const exact = 100 % stats.total === 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.top}>
        <Text style={[styles.percent, { color }]}>{stats.percent}%</Text>
        <Text style={[styles.text, { color: colors.text }]}>
          {stats.done} of {stats.total} {stats.total === 1 ? "task" : "tasks"}{" "}
          completed
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.track }]}>
        <View
          style={[
            styles.fill,
            { width: `${stats.percent}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.hint, { color: colors.muted }]}>
        Each task {exact ? "=" : "≈"} {eachTask}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 12, marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
  percent: { fontSize: 28, fontWeight: "bold", marginRight: 10 },
  text: { fontSize: 14 },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  hint: { fontSize: 12, marginTop: 6 },
});