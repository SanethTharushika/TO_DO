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

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const nowTimeString = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

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

// Does this task appear on the given date?
const appearsOn = (task, date) =>
  task.repeat === "daily" ? date >= task.date : task.date === date;

// Is this task done on the given date?
const isDoneOn = (task, date) =>
  task.repeat === "daily"
    ? (task.doneDates || []).includes(date)
    : !!task.done;

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
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setText("");
    setTime("");
    setRepeatDaily(false);
    setError("");
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setText(task.title);
    setTime(task.time || "");
    setRepeatDaily(task.repeat === "daily");
    setError("");
    setFormOpen(true);
  };

  // Handles both adding a new task and saving an edit
  const addTask = () => {
    if (!text.trim()) return;

    if (!editingId && selectedDate < todayString()) {
      setSelectedDate(todayString());
      return;
    }

    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError("Use the time format HH:MM, for example 14:30.");
      return;
    }

    // Editing: update the existing task
    if (editingId) {
      const original = tasks.find((t) => t.id === editingId);

      // Only block a past time if the time was actually changed
      if (
        !repeatDaily &&
        time &&
        time !== original.time &&
        selectedDate === todayString() &&
        time < nowTimeString()
      ) {
        setError("That time has already passed today.");
        return;
      }

      setTasks(
        tasks.map((t) => {
          if (t.id !== editingId) return t;
          const becameOneTime = t.repeat === "daily" && !repeatDaily;
          return {
            ...t,
            title: text.trim(),
            time: time,
            repeat: repeatDaily ? "daily" : "none",
            date: becameOneTime ? selectedDate : t.date,
            done: becameOneTime ? isDoneOn(t, selectedDate) : t.done,
          };
        })
      );
      closeForm();
      return;
    }

    // Adding a new task
    if (
      !repeatDaily &&
      time &&
      selectedDate === todayString() &&
      time < nowTimeString()
    ) {
      setError("That time has already passed today.");
      return;
    }

    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        title: text.trim(),
        date: selectedDate,
        time: time,
        repeat: repeatDaily ? "daily" : "none",
        done: false,
        doneDates: [],
      },
    ]);
    setText("");
    setTime("");
    setRepeatDaily(false);
    setError("");
  };

  // Tick / untick for the selected day only
  const toggleTask = (id) =>
    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        if (t.repeat === "daily") {
          const list = t.doneDates || [];
          const doneDates = list.includes(selectedDate)
            ? list.filter((d) => d !== selectedDate)
            : [...list, selectedDate];
          return { ...t, doneDates };
        }
        return { ...t, done: !t.done };
      })
    );

  // Deleting a daily task removes it from every day
  const deleteTask = (id) => {
    if (id === editingId) closeForm();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Calendar dots for one-time tasks only
  const markedDates = {};
  tasks
    .filter((t) => t.repeat !== "daily")
    .forEach((t) => {
      markedDates[t.date] = { marked: true, dotColor: COLOR };
    });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLOR,
  };

  // Tasks for the selected day, sorted by time (no time goes last)
  const dayTasks = tasks
    .filter((t) => appearsOn(t, selectedDate))
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
          if (editingId) closeForm();
          setSelectedDate(day.dateString);
          setFormOpen(true);
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

      <TouchableOpacity
        onPress={() => {
          if (editingId) closeForm();
          setSelectedDate(todayString());
          setFormOpen(true);
          setError("");
        }}
      >
        <Text style={styles.todayLink}>Jump to today</Text>
      </TouchableOpacity>

      <Text style={styles.dateTitle}>{prettyDate(selectedDate)}</Text>
      <Text style={styles.count}>
        {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
      </Text>

      {formOpen ? (
        <View style={styles.formBox}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingId ? "✏️ Edit task" : "New task"}
            </Text>
            <TouchableOpacity onPress={closeForm}>
              <Text style={styles.clear}>
                ✕ {editingId ? "Cancel" : "Close"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Task name..."
              value={text}
              onChangeText={setText}
              onSubmitEditing={addTask}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTask}>
              <Text style={styles.addText}>{editingId ? "Save" : "Add"}</Text>
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

          <TouchableOpacity
            style={[styles.repeatChip, repeatDaily && styles.repeatChipActive]}
            onPress={() => setRepeatDaily(!repeatDaily)}
          >
            <Text
              style={repeatDaily ? styles.repeatTextActive : styles.repeatText}
            >
              🔁 Repeat daily {repeatDaily ? "(on)" : ""}
            </Text>
          </TouchableOpacity>

          {error !== "" && <Text style={styles.error}>{error}</Text>}
        </View>
      ) : (
        <Text style={styles.hint}>👆 Tap a date to add a task</Text>
      )}
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
          renderItem={({ item }) => {
            const done = isDoneOn(item, selectedDate);
            return (
              <View style={styles.task}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => toggleTask(item.id)}
                >
                  <Text style={[styles.taskText, done && styles.done]}>
                    {done ? "✅ " : "⬜ "}
                    {item.title}
                  </Text>
                  <Text style={styles.metaText}>
                    {item.repeat === "daily" ? "🔁 Daily  " : ""}
                    {item.time ? `⏰ ${formatTime(item.time)}` : ""}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startEdit(item)}>
                  <Text style={styles.editBtn}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)}>
                  <Text style={styles.delete}>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          }}
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
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  timeLabel: { marginRight: 10, color: "#555" },
  timeInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, width: 80 },
  clear: { color: COLOR, marginLeft: 10, fontWeight: "600" },
  repeatChip: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#ccc", borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 8 },
  repeatChipActive: { backgroundColor: COLOR, borderColor: COLOR },
  repeatText: { color: "#333" },
  repeatTextActive: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 8 },
  task: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  taskText: { fontSize: 16 },
  metaText: { fontSize: 12, color: "#888", marginTop: 2 },
  done: { textDecorationLine: "line-through", color: "#999" },
  editBtn: { fontSize: 20, paddingLeft: 12 },
  delete: { fontSize: 20, paddingLeft: 12 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
  hint: { color: "#888", marginBottom: 12 },
  formBox: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 12 },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  formTitle: { fontSize: 16, fontWeight: "bold" },
});