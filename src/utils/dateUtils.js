const pad = (n) => String(n).padStart(2, "0");

export const dateToString = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayString = () => dateToString(new Date());

export const tomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateToString(d);
};

export const yesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateToString(d);
};

export const nowTimeString = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const formatTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${suffix}`;
};

export const prettyDate = (dateString) =>
  new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const dayLabel = (date) => {
  if (date === todayString()) return "Today";
  if (date === yesterdayString()) return "Yesterday";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};