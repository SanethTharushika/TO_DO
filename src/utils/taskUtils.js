import { todayString, nowTimeString } from "./dateUtils";

// Does this task appear on the given date?
export const appearsOn = (task, date) =>
  task.repeat === "daily" ? date >= task.date : task.date === date;

// Is this task done on the given date?
export const isDoneOn = (task, date) =>
  task.repeat === "daily"
    ? (task.doneDates || []).includes(date)
    : !!task.done;

// A daily task whose occurrence on this date was rescheduled
export const isMovedOn = (task, date) =>
  task.repeat === "daily" && (task.movedDates || []).includes(date);

// Status of a task on a given (past) date: "done" | "moved" | "missed"
export const statusOn = (task, date) => {
  if (isDoneOn(task, date)) return "done";
  if (isMovedOn(task, date)) return "moved";
  return "missed";
};

// A task is missed if its time/day has passed and it is not done
export const isOverdue = (task) => {
  const today = todayString();
  const now = nowTimeString();
  if (task.repeat === "daily") {
    return (
      appearsOn(task, today) &&
      !isDoneOn(task, today) &&
      !isMovedOn(task, today) &&
      !!task.time &&
      task.time < now
    );
  }
  if (task.done) return false;
  if (task.date < today) return true;
  return task.date === today && !!task.time && task.time < now;
};

export const getDayStats = (tasks, date) => {
  const list = tasks.filter(
    (t) => appearsOn(t, date) && !isMovedOn(t, date)
  );
  const total = list.length;
  const done = list.filter((t) => isDoneOn(t, date)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
};

// Missed tasks, oldest first
export const getMissedTasks = (tasks) => {
  const today = todayString();
  return tasks.filter(isOverdue).sort((a, b) => {
    const da = a.repeat === "daily" ? today : a.date;
    const db = b.repeat === "daily" ? today : b.date;
    if (da !== db) return da.localeCompare(db);
    return (a.time || "").localeCompare(b.time || "");
  });
};

// Tasks shown for one day, sorted by time (no time goes last)
export const getDayTasks = (tasks, date) => {
  const pastView = date < todayString();
  return tasks
    .filter((t) => {
      if (!appearsOn(t, date)) return false;
      if (pastView) return true; // history: show everything with its status
      return !isOverdue(t) && !isMovedOn(t, date);
    })
    .sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
};