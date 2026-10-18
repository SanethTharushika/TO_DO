import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "todo_tasks_v2";
const COLOR = "#4f46e5";

// Local date as YYYY-MM-DD (avoids timezone bugs)
const todayString = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const prettyDate = (dateString) =>
  new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function App() {
  const [text, setText] = useState("");
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
    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        title: text.trim(),
        date: selectedDate,
        done: false,
      },
    ]);
    setText("");
  };

  const toggleTask = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id) => setTasks(tasks.filter((t) => t.id !== id));

  // Dots on days that have tasks + highlight the selected day
  const markedDates = {};
  tasks.forEach((t) => {
    markedDates[t.date] = { marked: true, dotColor: COLOR };
  });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLOR,
  };

  const dayTasks = tasks.filter((t) => t.date === selectedDate);

  const header = (
    <View>
      <Text style={styles.heading}>My To-Do</Text>

      <Calendar
        current={selectedDate}
        minDate={todayString()}
        onDayPress={(day) => setSelectedDate(day.dateString)}
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
  task: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  taskText: { fontSize: 16 },
  done: { textDecorationLine: "line-through", color: "#999" },
  delete: { fontSize: 20, paddingLeft: 12 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});