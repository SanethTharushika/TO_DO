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