import { createSignal, createEffect } from "solid-js";
import { default_wallpapers } from "./system.js";
import { themes, applyTheme } from "./themes.js";
import { set, get } from "idb-keyval";

export const [queueProgram, setQueueProgram] = createSignal({});
export const [runningPrograms, setRunningPrograms] = createSignal([]);

export const [selectingItems, setSelectingItems] = createSignal([]);
export const [contextMenu, setContextMenu] = createSignal(null);
export const [zIndex, setZIndex] = createSignal(0);

export const [wallpaper, setWallpaper] = createSignal(null);

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
});

// Persist users and current user when they change
createEffect(() => persist("users", users()));
createEffect(() => persist("current_user", currentUser()));

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
