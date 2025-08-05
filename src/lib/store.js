import { createSignal, createEffect } from "solid-js";
import { themes, applyTheme } from "./themes.js";
import { set, get } from "idb-keyval";

export const [queueProgram, setQueueProgram] = createSignal({});
export const [runningPrograms, setRunningPrograms] = createSignal([]);

export const [selectingItems, setSelectingItems] = createSignal([]);
export const [contextMenu, setContextMenu] = createSignal(null);
export const [zIndex, setZIndex] = createSignal(0);

export const [wallpaper, setWallpaper] = createSignal(null);

export const [screensaver, setScreensaver] = createSignal(null);
export const [screensaverTimeout, setScreensaverTimeout] = createSignal(5);

export const [systemVolume, setSystemVolume] = createSignal(1);

export const [hardDrive, setHardDrive] = createSignal(null);
export const [clipboard, setClipboard] = createSignal([]);
export const [clipboardOp, setClipboardOp] = createSignal("copy");
export const [queueCommand, setQueueCommand] = createSignal(null);
export const [searchResults, setSearchResults] = createSignal([]);
export const [runHistory, setRunHistory] = createSignal([]);

// Track visibility of the Start Menu
export const [startMenuOpen, setStartMenuOpen] = createSignal(false);

// Theme selection
export const [theme, setTheme] = createSignal("lunaBlue");

// Current logged in user
export const [currentUser, setCurrentUser] = createSignal(null);
// Stored user profiles
export const [users, setUsers] = createSignal([]);

// Apply the initial theme
applyTheme(themes["lunaBlue"]);

function persist(key, value) {
  if (typeof indexedDB !== "undefined") {
    set(key, value);
  }
}

// Update CSS variables when the theme changes
createEffect(() => {
  const value = theme();
  if (themes[value]) {
    applyTheme(themes[value]);
  }
  persist("theme", value);
});

// Persist users and current user when they change
createEffect(() => persist("users", users()));
createEffect(() => persist("current_user", currentUser()));
createEffect(() => persist("wallpaper", wallpaper()));
createEffect(() => persist("screensaver", screensaver()));
createEffect(() => persist("screensaverTimeout", screensaverTimeout()));

// Apply wallpaper to page background
createEffect(() => {
  const wp = wallpaper();
  if (typeof document !== "undefined") {
    document.body.style.backgroundImage = wp ? `url(${wp})` : "";
  }
});

// Load user profiles from IndexedDB
export async function loadUsers() {
  if (typeof indexedDB === "undefined") return;
  let stored = await get("users");
  if (!stored) {
    stored = [{ id: 1, name: "User", password: "", avatar: "/images/xp/icons/UserAccounts.png" }];
    await set("users", stored);
  }
  setUsers(stored);

  const current = await get("current_user");
  if (current) {
    setCurrentUser(current);
  }
}

// Load selected theme from IndexedDB
export async function loadTheme() {
  if (typeof indexedDB === "undefined") return;
  const stored = await get("theme");
  if (stored && themes[stored]) {
    setTheme(stored);
  }
}

export async function loadScreensaver() {
  if (typeof indexedDB === "undefined") return;
  const ss = await get("screensaver");
  const timeout = await get("screensaverTimeout");
  if (ss != null) {
    setScreensaver(ss);
  }
  if (timeout != null) {
    setScreensaverTimeout(timeout);
  }
}
