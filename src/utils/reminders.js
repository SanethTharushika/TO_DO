import { Platform } from "react-native";

export const playBeep = () => {
  if (Platform.OS !== "web") return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 400);
  } catch (e) {}
  try {
    if (navigator.vibrate) navigator.vibrate(300);
  } catch (e) {}
};

export const showSystemNotification = (title, body) => {
  if (Platform.OS !== "web" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch (e) {}
};

export const getPermission = () =>
  Platform.OS === "web" && typeof Notification !== "undefined"
    ? Notification.permission
    : "unsupported";