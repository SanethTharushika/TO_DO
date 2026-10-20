import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView, Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLOR, GREEN, RED, DOT_PRIORITY } from "./src/constants/colors";
import { STORAGE_KEY, REMINDED_KEY } from "./src/constants/storageKeys";
import {
  dateToString, todayString, tomorrowString, nowTimeString,
  toMinutes, formatTime, prettyDate, dayLabel,
} from "./src/utils/dateUtils";
import {
  appearsOn, isDoneOn, isMovedOn, statusOn, isOverdue,
} from "./src/utils/taskUtils";
import {
  playBeep, showSystemNotification, getPermission,
} from "./src/utils/reminders";
import TimeField from "./src/components/TimeField";
import DateField from "./src/components/DateField";

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
  const [alerts, setAlerts] = useState([]);
  const [permission, setPermission] = useState(getPermission());
  const [, setTick] = useState(0);
  const remindedRef = useRef(new Set());

  // Reschedule panel state
  const [reschedule, setReschedule] = useState(null); // { taskId, occDate }
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");
  const [rError, setRError] = useState("");
  const [notice, setNotice] = useState("");

  // Refresh every 30 seconds and when you come back to the tab
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    let onVisible;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      onVisible = () => setTick((n) => n + 1);
      document.addEventListener("visibilitychange", onVisible);
    }
    return () => {
      clearInterval(id);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Auto-hide the green notice
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(id);
  }, [notice]);

  // Load saved tasks and already-reminded keys
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setTasks(JSON.parse(saved));
        const rem = await AsyncStorage.getItem(REMINDED_KEY);
        if (rem) remindedRef.current = new Set(JSON.parse(rem));
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

  // Reminder checker: runs now and then every 15 seconds
  useEffect(() => {
    if (!loaded) return;

    const check = () => {
      const today = todayString();
      const nowMin = toMinutes(nowTimeString());
      const fresh = [];

      tasks.forEach((t) => {
        if (
          !t.time ||
          !appearsOn(t, today) ||
          isDoneOn(t, today) ||
          isMovedOn(t, today)
        )
          return;
        const diff = nowMin - toMinutes(t.time);
        if (diff < 0 || diff > 10) return;
        const key = `${t.id}|${today}|${t.time}`;
        if (remindedRef.current.has(key)) return;
        remindedRef.current.add(key);
        fresh.push({ key, title: t.title, time: t.time });
      });

      if (fresh.length === 0) return;

      setAlerts((prev) => [...prev, ...fresh]);
      fresh.forEach((f) =>
        showSystemNotification("⏰ Task reminder", `${f.title} (${formatTime(f.time)})`)
      );
      playBeep();

      const keep = [...remindedRef.current].filter(
        (k) => k.split("|")[1] === today
      );
      remindedRef.current = new Set(keep);
      AsyncStorage.setItem(REMINDED_KEY, JSON.stringify(keep)).catch(() => {});
    };

    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [tasks, loaded]);

  const dismissAlert = (key) =>
    setAlerts((prev) => prev.filter((a) => a.key !== key));

  const enableNotifications = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (e) {}
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setText("");
    setTime("");
    setRepeatDaily(false);
    setError("");
  };

  const startEdit = (task) => {
    cancelReschedule();
    setEditingId(task.id);
    setText(task.title);
    setTime(task.time || "");
    setRepeatDaily(task.repeat === "daily");
    setError("");
    setFormOpen(true);
  };

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

    if (editingId) {
      const original = tasks.find((t) => t.id === editingId);

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
        movedDates: [],
      },
    ]);
    setText("");
    setTime("");
    setRepeatDaily(false);
    setError("");
  };

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

  const deleteTask = (id) => {
    if (id === editingId) closeForm();
    if (reschedule && reschedule.taskId === id) cancelReschedule();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // ----- Missed / past task actions -----
  const markDoneOn = (task, date) =>
    setTasks(
      tasks.map((t) => {
        if (t.id !== task.id) return t;
        if (t.repeat === "daily") {
          return { ...t, doneDates: [...(t.doneDates || []), date] };
        }
        return { ...t, done: true };
      })
    );

  const startReschedule = (task, occDate) => {
    if (editingId) closeForm();
    setReschedule({ taskId: task.id, occDate });
    setRDate(tomorrowString());
    setRTime(task.time || "");
    setRError("");
  };

  const cancelReschedule = () => {
    setReschedule(null);
    setRError("");
  };

  const isRescheduling = (taskId, occDate) =>
    !!reschedule &&
    reschedule.taskId === taskId &&
    reschedule.occDate === occDate;

  const saveReschedule = () => {
    if (!reschedule) return;
    const task = tasks.find((t) => t.id === reschedule.taskId);
    if (!task) {
      cancelReschedule();
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(rDate) ||
      isNaN(new Date(rDate + "T00:00:00").getTime())
    ) {
      setRError("Pick a valid date.");
      return;
    }
    if (rDate < todayString()) {
      setRError("Choose today or a future date.");
      return;
    }
    if (rTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(rTime)) {
      setRError("Use the time format HH:MM, for example 14:30.");
      return;
    }
    if (rDate === todayString() && rTime && rTime < nowTimeString()) {
      setRError("That time has already passed today. Pick a later time.");
      return;
    }

    if (task.repeat === "daily") {
      // Only this day's occurrence moves: copy it as a one-time task
      const copy = {
        id: Date.now().toString(),
        title: task.title,
        date: rDate,
        time: rTime,
        repeat: "none",
        done: false,
        doneDates: [],
        movedDates: [],
      };
      setTasks([
        ...tasks.map((t) =>
          t.id === task.id
            ? { ...t, movedDates: [...(t.movedDates || []), reschedule.occDate] }
            : t
        ),
        copy,
      ]);
    } else {
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, date: rDate, time: rTime, done: false } : t
        )
      );
    }

    setNotice(
      `📅 "${task.title}" moved to ${prettyDate(rDate)}${
        rTime ? " at " + formatTime(rTime) : ""
      }`
    );
    cancelReschedule();
  };

  const renderReschedule = () => (
    <View style={styles.reschedBox}>
      <Text style={styles.reschedTitle}>📅 Reschedule to</Text>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Date</Text>
        <DateField
          value={rDate}
          onChange={(v) => {
            setRDate(v);
            setRError("");
          }}
        />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>⏰ Time</Text>
        <TimeField
          value={rTime}
          onChange={(v) => {
            setRTime(v);
            setRError("");
          }}
        />
        {rTime !== "" && (
          <TouchableOpacity onPress={() => setRTime("")}>
            <Text style={styles.clear}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {rError !== "" && <Text style={styles.error}>{rError}</Text>}

      <View style={styles.reschedActions}>
        <TouchableOpacity style={styles.addBtn} onPress={saveReschedule}>
          <Text style={styles.addText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={cancelReschedule}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const today = todayString();
  const pastView = selectedDate < today;

  // ----- Calendar dots: green = completed, red = missed, purple = upcoming -----
  const markedDates = {};
  const mark = (date, color) => {
    const cur = markedDates[date];
    if (!cur || DOT_PRIORITY[color] > DOT_PRIORITY[cur.dotColor]) {
      markedDates[date] = { marked: true, dotColor: color };
    }
  };

  tasks.forEach((t) => {
    if (t.repeat === "daily") {
      const d = new Date(t.date + "T00:00:00");
      for (let i = 0; i < 366; i++) {
        const ds = dateToString(d);
        if (ds >= today) break;
        mark(ds, statusOn(t, ds) === "missed" ? RED : GREEN);
        d.setDate(d.getDate() + 1);
      }
    } else if (t.date < today) {
      mark(t.date, t.done ? GREEN : RED);
    } else {
      mark(t.date, COLOR);
    }
  });

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLOR,
  };

  // Missed tasks box (oldest first)
  const missedTasks = tasks
    .filter(isOverdue)
    .sort((a, b) => {
      const da = a.repeat === "daily" ? today : a.date;
      const db = b.repeat === "daily" ? today : b.date;
      if (da !== db) return da.localeCompare(db);
      return (a.time || "").localeCompare(b.time || "");
    });

  // Tasks for the selected day
  const dayTasks = tasks
    .filter((t) => {
      if (!appearsOn(t, selectedDate)) return false;
      if (pastView) return true; // history: show everything with its status
      return !isOverdue(t) && !isMovedOn(t, selectedDate);
    })
    .sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

  const pastDone = pastView
    ? dayTasks.filter((t) => statusOn(t, selectedDate) === "done").length
    : 0;
  const pastMissed = pastView
    ? dayTasks.filter((t) => statusOn(t, selectedDate) === "missed").length
    : 0;

  const header = (
    <View>
      <Text style={styles.heading}>My To-Do</Text>

      {notice !== "" && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

      {!pastView && missedTasks.length > 0 && (
        <View style={styles.missedBox}>
          <Text style={styles.missedTitle}>
            ⚠️ Missed ({missedTasks.length})
          </Text>
          {missedTasks.map((t) => {
            const occ = t.repeat === "daily" ? today : t.date;
            return (
              <View key={t.id} style={styles.missedRow}>
                <Text style={styles.missedText}>{t.title}</Text>
                <Text style={styles.missedMeta}>
                  {t.repeat === "daily" ? "🔁 " : ""}
                  {dayLabel(occ)}
                  {t.time ? ` · ${formatTime(t.time)}` : ""}
                </Text>
                <View style={styles.missedActions}>
                  <TouchableOpacity onPress={() => markDoneOn(t, occ)}>
                    <Text style={styles.missedAction}>✅ Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => startReschedule(t, occ)}>
                    <Text style={styles.missedAction}>📅 Reschedule</Text>
                  </TouchableOpacity>
                  {t.repeat !== "daily" && (
                    <TouchableOpacity onPress={() => deleteTask(t.id)}>
                      <Text style={styles.missedAction}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {isRescheduling(t.id, occ) && renderReschedule()}
              </View>
            );
          })}
        </View>
      )}

      <Calendar
        current={selectedDate}
        onDayPress={(day) => {
          if (editingId) closeForm();
          cancelReschedule();
          setSelectedDate(day.dateString);
          setFormOpen(day.dateString >= todayString());
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

      <Text style={styles.legend}>🟣 Upcoming   🟢 Completed   🔴 Missed</Text>

      <TouchableOpacity
        onPress={() => {
          if (editingId) closeForm();
          cancelReschedule();
          setSelectedDate(todayString());
          setFormOpen(true);
          setError("");
        }}
      >
        <Text style={styles.todayLink}>Jump to today</Text>
      </TouchableOpacity>

      {permission === "default" && (
        <TouchableOpacity style={styles.notifBtn} onPress={enableNotifications}>
          <Text style={styles.notifText}>🔔 Enable notifications</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.dateTitle}>{prettyDate(selectedDate)}</Text>
      <Text style={styles.count}>
        {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
        {pastView && dayTasks.length > 0
          ? `  ·  ✅ ${pastDone} completed  ·  ❌ ${pastMissed} missed`
          : ""}
      </Text>

      {pastView ? (
        <Text style={styles.hint}>
          📜 Past day, view only. You can reschedule missed tasks.
        </Text>
      ) : formOpen ? (
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
        {alerts.map((a) => (
          <View key={a.key} style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⏰ {a.title} — {formatTime(a.time)}
            </Text>
            <TouchableOpacity onPress={() => dismissAlert(a.key)}>
              <Text style={styles.alertClose}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ))}

        <FlatList
          data={dayTasks}
          extraData={{ reschedule, rDate, rTime, rError, selectedDate }}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {pastView ? "No tasks on this day." : "No tasks for this day."}
            </Text>
          }
          renderItem={({ item }) => {
            // ----- Past day: read-only with status -----
            if (pastView) {
              const status = statusOn(item, selectedDate);
              return (
                <View style={styles.pastItem}>
                  <Text
                    style={[styles.taskText, status === "done" && styles.done]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.metaText}>
                    {item.repeat === "daily" ? "🔁 Daily  " : ""}
                    {item.time ? `⏰ ${formatTime(item.time)}` : ""}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      status === "done"
                        ? styles.badgeDone
                        : status === "moved"
                        ? styles.badgeMoved
                        : styles.badgeMissed,
                    ]}
                  >
                    {status === "done"
                      ? "✅ Completed"
                      : status === "moved"
                      ? "📅 Rescheduled"
                      : "❌ Missed"}
                  </Text>

                  {status === "missed" && (
                    <View style={styles.missedActions}>
                      <TouchableOpacity
                        onPress={() => markDoneOn(item, selectedDate)}
                      >
                        <Text style={styles.missedAction}>✅ Mark done</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => startReschedule(item, selectedDate)}
                      >
                        <Text style={styles.missedAction}>📅 Reschedule</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isRescheduling(item.id, selectedDate) && renderReschedule()}
                </View>
              );
            }

            // ----- Today / future -----
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
  legend: { color: "#888", fontSize: 12, marginTop: 8 },
  todayLink: { color: COLOR, textAlign: "right", marginTop: 4, fontWeight: "600" },
  notifBtn: { alignSelf: "flex-start", borderWidth: 1, borderColor: COLOR, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginTop: 8 },
  notifText: { color: COLOR, fontWeight: "600" },
  dateTitle: { fontSize: 18, fontWeight: "bold", marginTop: 12 },
  count: { color: "#888", marginBottom: 12 },
  addRow: { flexDirection: "row", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginRight: 8 },
  addBtn: { backgroundColor: COLOR, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, justifyContent: "center" },
  addText: { color: "#fff", fontWeight: "bold" },
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  timeLabel: { marginRight: 10, color: "#555" },
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
  alertBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef3c7", borderRadius: 12, padding: 12, marginBottom: 8 },
  alertText: { flex: 1, fontWeight: "600", color: "#92400e" },
  alertClose: { color: COLOR, fontWeight: "600", marginLeft: 10 },
  noticeBox: { backgroundColor: "#dcfce7", borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { color: "#166534", fontWeight: "600" },
  missedBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12, marginBottom: 12 },
  missedTitle: { fontSize: 16, fontWeight: "bold", color: "#b91c1c", marginBottom: 8 },
  missedRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#fecaca" },
  missedText: { fontSize: 16, color: "#7f1d1d" },
  missedMeta: { fontSize: 12, color: "#b91c1c", marginTop: 2 },
  missedActions: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  missedAction: { color: COLOR, fontWeight: "600", marginRight: 16, marginBottom: 4 },
  pastItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  badge: { alignSelf: "flex-start", fontSize: 12, fontWeight: "600", borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, marginTop: 6, overflow: "hidden" },
  badgeDone: { backgroundColor: "#dcfce7", color: "#166534" },
  badgeMissed: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  badgeMoved: { backgroundColor: "#e0e7ff", color: "#3730a3" },
  reschedBox: { backgroundColor: "#f5f3ff", borderRadius: 12, padding: 12, marginTop: 10 },
  reschedTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 10 },
  reschedActions: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cancelText: { color: COLOR, fontWeight: "600", marginLeft: 16 },
});