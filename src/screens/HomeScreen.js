import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useTheme } from "../context/ThemeContext";
import {
  todayString, tomorrowString, nowTimeString, formatTime, prettyDate,
} from "../utils/dateUtils";
import {
  isDoneOn, statusOn, getDayStats, getMissedTasks, getDayTasks,
} from "../utils/taskUtils";
import { buildMarkedDates } from "../utils/calendarUtils";

import CalendarDay from "../components/CalendarDay";
import ReminderAlerts from "../components/ReminderAlerts";
import MissedBox from "../components/MissedBox";
import ProgressCard from "../components/ProgressCard";
import TaskForm from "../components/TaskForm";
import TaskItem from "../components/TaskItem";
import PastTaskItem from "../components/PastTaskItem";
import ReschedulePanel from "../components/ReschedulePanel";
import ThemeToggle from "../components/ThemeToggle";
import Clock from "../components/Clock";

import useTasks from "../hooks/useTasks";
import useReminders from "../hooks/useReminders";
import useTick from "../hooks/useTick";

export default function HomeScreen() {
  const { colors, isDark } = useTheme();

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
  const [jumpCount, setJumpCount] = useState(0);
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
  const markedDates = buildMarkedDates(tasks, selectedDate);
  const missedTasks = getMissedTasks(tasks);
  const dayTasks = getDayTasks(tasks, selectedDate);

  const pastDone = pastView
    ? dayTasks.filter((t) => statusOn(t, selectedDate) === "done").length
    : 0;
  const pastMissed = pastView
    ? dayTasks.filter((t) => statusOn(t, selectedDate) === "missed").length
    : 0;

  const header = (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text }]}>My To-Do</Text>
        <ThemeToggle />
      </View>

      <Clock />

      {notice !== "" && (
        <View style={[styles.noticeBox, { backgroundColor: colors.noticeBg }]}>
          <Text style={[styles.noticeText, { color: colors.noticeText }]}>
            {notice}
          </Text>
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
        key={`${isDark ? "calendar-dark" : "calendar-light"}-${jumpCount}`}
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
          backgroundColor: colors.card,
          calendarBackground: colors.card,
          textSectionTitleColor: colors.muted,
          dayTextColor: colors.calendarText,
          monthTextColor: colors.text,
          todayTextColor: colors.link,
          arrowColor: colors.link,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#ffffff",
          textDisabledColor: colors.otherMonth,
        }}
        style={[
          styles.calendar,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      />

      <Text style={[styles.legend, { color: colors.muted }]}>
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
        <Text style={[styles.todayLink, { color: colors.link }]}>
          Jump to today
        </Text>
      </TouchableOpacity>

      {permission === "default" && (
        <TouchableOpacity
          style={[styles.notifBtn, { borderColor: colors.link }]}
          onPress={enableNotifications}
        >
          <Text style={[styles.notifText, { color: colors.link }]}>
            🔔 Enable notifications
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.dateTitle, { color: colors.text }]}>
        {prettyDate(selectedDate)}
      </Text>
      <Text style={[styles.count, { color: colors.muted }]}>
        {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
        {pastView && dayTasks.length > 0
          ? `  ·  ✅ ${pastDone} completed  ·  ❌ ${pastMissed} missed`
          : ""}
      </Text>

      {selectedDate <= today && (
        <ProgressCard stats={stats} isToday={selectedDate === today} />
      )}

      {pastView ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
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
        <Text style={[styles.hint, { color: colors.muted }]}>
          👆 Tap a date to add a task
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <ReminderAlerts alerts={alerts} onDismiss={dismissAlert} />

        <FlatList
          data={dayTasks}
          extraData={{ reschedule, rDate, rTime, rError, selectedDate, isDark }}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
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
                locked={selectedDate > today}
                onToggle={
                  selectedDate > today
                    ? undefined
                    : () => toggleTask(item.id, selectedDate)
                }
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
  safe: { flex: 1 },
  container: { flex: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingTop: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heading: { fontSize: 28, fontWeight: "bold" },
  calendar: { borderWidth: 1, borderRadius: 12 },
  legend: { fontSize: 12, marginTop: 8 },
  todayLink: { textAlign: "right", marginTop: 4, fontWeight: "600" },
  notifBtn: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginTop: 8 },
  notifText: { fontWeight: "600" },
  dateTitle: { fontSize: 18, fontWeight: "bold", marginTop: 12 },
  count: { marginBottom: 12 },
  hint: { marginBottom: 12 },
  empty: { textAlign: "center", marginTop: 20 },
  noticeBox: { borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { fontWeight: "600" },
});