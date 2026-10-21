import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR, GREEN, RED, AMBER } from "../constants/colors";
import { todayString } from "../utils/dateUtils";

export default function CalendarDay({ date, state, marking, onPress }) {
  const today = todayString();
  const isToday = date.dateString === today;
  const isPast = date.dateString < today;
  const isOtherMonth = state === "disabled";
  const isSelected = !!(marking && marking.selected);
  const dotColor = marking && marking.marked ? marking.dotColor : null;
  const percent =
    marking && marking.percent !== undefined ? marking.percent : null;

  let textColor = "#2d4150";
  if (isPast) textColor = "#b8bcc4";
  if (isOtherMonth) textColor = "#d9dde3";
  if (isToday) textColor = COLOR;
  if (isSelected) textColor = "#fff";

  let circleColor = "transparent";
  if (isToday) circleColor = "#eef2ff";
  if (isSelected) circleColor = isPast ? "#a5a8f5" : COLOR;

  // Bar colour: green = all done, purple = today in progress,
  // red = nothing done, orange = partly done
  let barColor = AMBER;
  if (percent === 100) barColor = GREEN;
  else if (isToday) barColor = COLOR;
  else if (percent === 0) barColor = RED;

  return (
    <TouchableOpacity style={styles.wrap} onPress={() => onPress(date)}>
      <View style={[styles.circle, { backgroundColor: circleColor }]}>
        <Text
          style={[styles.text, { color: textColor }, isToday && styles.bold]}
        >
          {date.day}
        </Text>
      </View>

      {percent !== null && (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${percent}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      )}

      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 36, height: 40, alignItems: "center" },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 16 },
  bold: { fontWeight: "bold" },
  track: {
    position: "absolute",
    bottom: 0,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  fill: { height: 4, borderRadius: 2 },
  dot: {
    position: "absolute",
    bottom: 0,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});