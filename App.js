import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { COLOR } from "./src/constants/colors";
import {
  dateToString, todayString, tomorrowString, nowTimeString,
  formatTime, prettyDate,
} from "./src/utils/dateUtils";
import {
  appearsOn, isDoneOn, isMovedOn, statusOn, isOverdue, getDayStats,
} from "./src/utils/taskUtils";

import CalendarDay from "./src/components/CalendarDay";
import ReminderAlerts from "./src/components/ReminderAlerts";
import MissedBox from "./src/components/MissedBox";
import ProgressCard from "./src/components/ProgressCard";
import TaskForm from "./src/components/TaskForm";
import TaskItem from "./src/components/TaskItem";
import PastTaskItem from "./src/components/PastTaskItem";
import ReschedulePanel from "./src/components/ReschedulePanel";

import useTasks from "./src/hooks/useTasks";
import useReminders from "./src/hooks/useReminders";
import useTick from "./src/hooks/useTick";

export default function App() {
  // ----- Data and background logic (hooks) -----
  const {
    tasks, loaded, addTask, updateTask, toggleTask,
    deleteTask, markDoneOn, rescheduleTask,
  } = useTasks();
  const { alerts, dismissAlert, permission, enableNotifications } =
    useReminders(tasks, loaded);
  useTick();

  // ----- Screen state -----
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [notice, setNotice] = useState("");

  // Add / edit form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [error, setError] = useState("");

  // Reschedule panel state
  const [reschedule, setReschedule] = useState(null); // { taskId, occDate }
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");
  const [rError, setRError] = useState("");

  // Auto-hide the green notice
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(id);
  }, [notice]);

  // ----- Form actions -----
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

  // Handles both adding a new task and saving an edit
  const submitTask = () => {
    if (!text.trim()) return;

    if (!editingId && selectedDate < todayString()) {
      setSelectedDate(todayString());
      return;
    }

    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError("Use the time format HH:MM, for example 14:30.");
      return;
    }

    const repeat = repeatDaily ? "daily" : "none";

    if (editingId) {
      const original = tasks.find((t) => t.id === editingId);

      // Only block a past time if the time was actually changed
      if (
        !repeatDaily &&
        time &&
        original &&
        time !== original.time &&
        selectedDate === todayString() &&
        time < nowTimeString()
      ) {
        setError("That time has already passed today.");
        return;
      }

      updateTask(editingId, { title: text.trim(), time, repeat }, selectedDate);
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

    addTask({ title: text.trim(), date: selectedDate, time, repeat });
    setText("");
    setTime("");
    setRepeatDaily(false);
    setError("");
  };

  const handleDelete = (id) => {
    if (id === editingId) closeForm();
    if (reschedule && reschedule.taskId === id) cancelReschedule();
    deleteTask(id);
  };

  // ----- Reschedule actions -----
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

    rescheduleTask(reschedule.taskId, reschedule.occDate, rDate, rTime);

    setNotice(
      `📅 "${task.title}" moved to ${prettyDate(rDate)}${
        rTime ? " at " + formatTime(rTime) : ""
      }`
    );
    cancelReschedule();
  };

  // The reschedule panel, shown under the task being rescheduled
  const renderPanel = (task, occDate) =>
    isRescheduling(task.id, occDate) ? (
      <ReschedulePanel
        date={rDate}
        time={rTime}
        error={rError}
        onDateChange={(v) => {
          setRDate(v);
          setRError("");
        }}
        onTimeChange={(v) => {
          setRTime(v);
          setRError("");
        }}
        onSave={saveReschedule}
        onCancel={cancelReschedule}
      />
    ) : null;

  // ----- Derived data -----
  const today = todayString();
  const pastView = selectedDate < today;
  const stats = getDayStats(tasks, selectedDate);

  // Calendar: progress bar on today/past days, purple dot on future days
  const markedDates = {};
  const candidateDates = new Set();

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 365);
  windowStart.setHours(0, 0, 0, 0);

  tasks.forEach((t) => {
    if (t.repeat === "daily") {
      const d = new Date(t.date + "T00:00:00");
      if (d < windowStart) d.setTime(windowStart.getTime());
      for (let i = 0; i < 400; i++) {
        const ds = dateToString(d);
        if (ds > today) break;
        candidateDates.add(ds);
        d.setDate(d.getDate() + 1);
      }
      if (t.date > today) candidateDates.add(t.date);
    } else {
      candidateDates.add(t.date);
    }
  });

  candidateDates.forEach((ds) => {
    const s = getDayStats(tasks, ds);
    if (s.total === 0) return;
    if (ds > today) {
      markedDates[ds] = { marked: true, dotColor: COLOR };
    } else {
      markedDates[ds] = { percent: s.percent, total: s.total };
    }
  });

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: COLOR,
  };

  // Missed tasks (oldest first)
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

      <MissedBox
        tasks={pastView ? [] : missedTasks}
        today={today}
        onDone={markDoneOn}
        onReschedule={startReschedule}
        onDelete={handleDelete}
        renderPanel={renderPanel}
      />

      <Calendar
        current={selectedDate}
        dayComponent={CalendarDay}
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

      <Text style={styles.legend}>
        🟣 Upcoming   ·   Bar under a date = % completed
      </Text>

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

      {selectedDate <= today && (
        <ProgressCard stats={stats} isToday={selectedDate === today} />
      )}

      {pastView ? (
        <Text style={styles.hint}>
          📜 Past day, view only. You can reschedule missed tasks.
        </Text>
      ) : formOpen ? (
        <TaskForm
          isEditing={!!editingId}
          text={text}
          time={time}
          repeatDaily={repeatDaily}
          error={error}
          onTextChange={setText}
          onTimeChange={(v) => {
            setTime(v);
            setError("");
          }}
          onToggleRepeat={() => setRepeatDaily(!repeatDaily)}
          onSubmit={submitTask}
          onClose={closeForm}
        />
      ) : (
        <Text style={styles.hint}>👆 Tap a date to add a task</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ReminderAlerts alerts={alerts} onDismiss={dismissAlert} />

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
            if (pastView) {
              return (
                <PastTaskItem
                  task={item}
                  status={statusOn(item, selectedDate)}
                  onMarkDone={() => markDoneOn(item, selectedDate)}
                  onReschedule={() => startReschedule(item, selectedDate)}
                  panel={renderPanel(item, selectedDate)}
                />
              );
            }
            return (
              <TaskItem
                task={item}
                done={isDoneOn(item, selectedDate)}
                onToggle={() => toggleTask(item.id, selectedDate)}
                onEdit={() => startEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
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
  hint: { color: "#888", marginBottom: 12 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
  noticeBox: { backgroundColor: "#dcfce7", borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { color: "#166534", fontWeight: "600" },
});