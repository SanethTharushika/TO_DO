import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLOR } from "../constants/colors";
import { todayString } from "../utils/dateUtils";

export default function CalendarDay({ date, state, marking, onPress }) {
  const today = todayString();
  const isToday = date.dateString === today;
  const isPast = date.dateString < today;
  const isOtherMonth = state === "disabled"; // days shown from next/previous month
  const isSelected = !!(marking && marking.selected);
  const dotColor = marking && marking.marked ? marking.dotColor : null;

  let textColor = "#2d4150"; // future days: clear
  if (isPast) textColor = "#b8bcc4"; // past days: faded
  if (isOtherMonth) textColor = "#d9dde3"; // other-month days: lightest
  if (isToday) textColor = COLOR;
  if (isSelected) textColor = "#fff";

  let circleColor = "transparent";
  if (isToday) circleColor = "#eef2ff"; // soft highlight for today
  if (isSelected) circleColor = isPast ? "#a5a8f5" : COLOR; // lighter circle on past days

  return (
    <TouchableOpacity style={styles.wrap} onPress={() => onPress(date)}>
      <View style={[styles.circle, { backgroundColor: circleColor }]}>
        <Text
          style={[
            styles.text,
            { color: textColor },
            isToday && styles.bold,
          ]}
        >
          {date.day}
        </Text>
      </View>
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 36, height: 38, alignItems: "center" },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 16 },
  bold: { fontWeight: "bold" },
  dot: {
    position: "absolute",
    bottom: 0,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});