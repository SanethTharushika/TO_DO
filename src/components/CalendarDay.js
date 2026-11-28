import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { todayString } from "../utils/dateUtils";

export default function CalendarDay({ date, state, marking, onPress }) {
  const { colors } = useTheme();

  const today = todayString();
  const isToday = date.dateString === today;
  const isPast = date.dateString < today;
  const isOtherMonth = state === "disabled";
  const isSelected = !!(marking && marking.selected);
  const hasDot = !!(marking && marking.marked);
  const percent =
    marking && marking.percent !== undefined ? marking.percent : null;

  let textColor = colors.calendarText;
  if (isPast) textColor = colors.pastText;
  if (isOtherMonth) textColor = colors.otherMonth;
  if (isToday) textColor = colors.link;
  if (isSelected) textColor = "#ffffff";

  let circleColor = "transparent";
  if (isToday) circleColor = colors.todayBg;
  if (isSelected) circleColor = isPast ? colors.selectedPast : colors.primary;

  // Bar colour: green = all done, accent = today in progress,
  // red = nothing done, orange = partly done
  let barColor = colors.warning;
  if (percent === 100) barColor = colors.success;
  else if (isToday) barColor = colors.link;
  else if (percent === 0) barColor = colors.danger;

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
        <View style={[styles.track, { backgroundColor: colors.track }]}>
          <View
            style={[
              styles.fill,
              { width: `${percent}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      )}

      {hasDot && (
        <View style={[styles.dot, { backgroundColor: colors.link }]} />
      )}
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