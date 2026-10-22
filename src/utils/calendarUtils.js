import { COLOR } from "../constants/colors";
import { dateToString, todayString } from "./dateUtils";
import { getDayStats } from "./taskUtils";

// Calendar marks: progress bar on today/past days, purple dot on future days
export const buildMarkedDates = (tasks, selectedDate) => {
  const today = todayString();
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

  return markedDates;
};