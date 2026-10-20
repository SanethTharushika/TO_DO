import { Platform, StyleSheet, TextInput } from "react-native";
import { todayString } from "../utils/dateUtils";

export default function DateField({ value, onChange }) {
  if (Platform.OS === "web") {
    return (
      <input
        type="date"
        value={value}
        min={todayString()}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 16,
          padding: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontFamily: "inherit",
        }}
      />
    );
  }
  return (
    <TextInput
      style={styles.dateInput}
      placeholder="YYYY-MM-DD"
      value={value}
      onChangeText={onChange}
      maxLength={10}
    />
  );
}

const styles = StyleSheet.create({
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    width: 130,
  },
});