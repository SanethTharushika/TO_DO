import { Platform, StyleSheet, TextInput } from "react-native";

export default function TimeField({ value, onChange }) {
  if (Platform.OS === "web") {
    return (
      <input
        type="time"
        value={value}
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
      style={styles.timeInput}
      placeholder="HH:MM"
      value={value}
      onChangeText={onChange}
      maxLength={5}
    />
  );
}

const styles = StyleSheet.create({
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    width: 80,
  },
});