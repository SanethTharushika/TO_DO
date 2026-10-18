import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView, Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "todo_tasks_v2";
const COLOR = "#4f46e5";

const pad = (n) => String(n).padStart(2, "0");

// Local date as YYYY-MM-DD
const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Current time as HH:MM (24h)
const nowTimeString = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "14:30" -> "2:30 PM"
const formatTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
};

const prettyDate = (dateString) =>
  new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// Time picker: native time input on web, simple text box elsewhere
function TimeField({ value, onChange }) {
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

export default function App() {
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [loaded, setLoaded] = useState(false);

  // Load saved tasks
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setTasks(JSON.parse(saved));
      } catch (e) {
        console.log("Load error", e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch((e) =>
      console.log("Save error", e)
    );
  }, [tasks, loaded]);

  const addTask = () => {
    if (!text.trim()) return;

    // Block past dates
    if (selectedDate < todayString()) {
      setSelectedDate(todayString());
      return;
    }

    // Block past times for today
    if (time && selectedDate === todayString() && time < nowTimeString()) {
      setError("That time has already passed today.");
      return;
    }

    // Basic format check (for the text box on non-web)
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError("Use the time format HH:MM, for example 14:30.");
      return;
    }

    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        title: text.trim(),
        date: selectedDate,
        time: time, // "" means no time
        done: false,
      },
    ]);
    setText("");
    setTime("");
    setError("");
  };

  const toggleTask = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id) => setTasks(tasks.filter((t) => t.id !== id));

  // Dots on days that have tasks + highlight selected day
  const markedDates = {};
  tasks.forEach((t) => {
    markedDates[t.date] = { marked: true, dotColor: COLOR };
  });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLOR,
  };

  // Tasks for the selected day, sorted by time (no time goes last)
  const dayTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

  const header = (
    <View>
      <Text style={styles.heading}>My To-Do</Text>

      <Calendar
        current={selectedDate}
        minDate={todayString()}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setError("");
        }}
        markedDates={markedDates}
        theme={{
          todayTextColor: COLOR,
          arrowColor: COLOR,
          selectedDayBackgroundColor: COLOR,
        }}
        style={styles.calendar}
      />

      <TouchableOpacity onPress={() => setSelectedDate(todayString())}>
        <Text style={styles.todayLink}>Jump to today</Text>
      </TouchableOpacity>

      <Text style={styles.dateTitle}>{prettyDate(selectedDate)}</Text>
      <Text style={styles.count}>
        {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
      </Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task for this day..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTask}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>⏰ Time (optional)</Text>
        <TimeField
          value={time}
          onChange={(v) => {
            setTime(v);
            setError("");
          }}
        />
        {time !== "" && (
          <TouchableOpacity onPress={() => setTime("")}>
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {error !== "" && <Text style={styles.error}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={dayTasks}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text style={styles.empty}>No tasks for this day.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.task}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTask(item.id)}>
                <Text style={[styles.taskText, item.done && styles.done]}>
                  {item.done ? "✅ " : "⬜ "}
                  {item.title}
                </Text>
                {item.time ? (
                  <Text style={styles.timeText}>⏰ {formatTime(item.time)}</Text>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Text style={styles.delete}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingTop: 40 },
  heading: { fontSize: 28, fontWeight: "bold", marginBottom: 12 },
  calendar: { borderWidth: 1, borderColor: "#eee", borderRadius: 12 },
  todayLink: { color: COLOR, textAlign: "right", marginTop: 8, fontWeight: "600" },
  dateTitle: { fontSize: 18, fontWeight: "bold", marginTop: 12 },
  count: { color: "#888", marginBottom: 12 },
  addRow: { flexDirection: "row", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginRight: 8 },
  addBtn: { backgroundColor: COLOR, borderRadius: 8, paddingHorizontal: 20, justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "bold" },
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  timeLabel: { marginRight: 10, color: "#555" },
  timeInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, width: 80 },
  clear: { color: COLOR, marginLeft: 10, fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 8 },
  task: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  taskText: { fontSize: 16 },
  timeText: { fontSize: 12, color: "#888", marginTop: 2 },
  done: { textDecorationLine: "line-through", color: "#999" },
  delete: { fontSize: 20, paddingLeft: 12 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});