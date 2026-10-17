import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "todo_tasks";
const DAYS = ["Today", "Tomorrow", "Later"];

export default function App() {
  const [text, setText] = useState("");
  const [day, setDay] = useState("Today");
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved tasks when the app opens
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

  // Save tasks every time they change
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
      { id: Date.now().toString(), title: text.trim(), day, done: false },
    ]);
    setText("");
  };

  const toggleTask = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My To-Do</Text>

      <TextInput
        style={styles.input}
        placeholder="What needs to be done?"
        value={text}
        onChangeText={setText}
        onSubmitEditing={addTask}
      />

      <View style={styles.row}>
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, day === d && styles.chipActive]}
            onPress={() => setDay(d)}
          >
            <Text style={day === d && styles.chipTextActive}>{d}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks yet. Add one above!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.task}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTask(item.id)}>
              <Text style={[styles.taskText, item.done && styles.done]}>
                {item.done ? "✅ " : "⬜ "}
                {item.title}
              </Text>
              <Text style={styles.dayText}>{item.day}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.delete}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  heading: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: "#ccc", borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipTextActive: { color: "#fff" },
  addBtn: { marginLeft: "auto", backgroundColor: "#4f46e5", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20 },
  addText: { color: "#fff", fontWeight: "bold" },
  task: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  taskText: { fontSize: 16 },
  done: { textDecorationLine: "line-through", color: "#999" },
  dayText: { fontSize: 12, color: "#888", marginTop: 2 },
  delete: { fontSize: 20, paddingLeft: 12 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});