import { writable } from "svelte/store";
import { default_wallpapers } from './system';
import { themes, applyTheme } from './themes';
import { get, set } from 'idb-keyval';

export let queueProgram = writable({});
export let runningPrograms = writable([]);

export let selectingItems = writable([]);
export let contextMenu = writable(null);
export let zIndex = writable(0);

export let wallpaper = writable(null);

export let systemVolume = writable(1);

export let hardDrive = writable(null);
export let clipboard = writable([]);
export let clipboard_op = writable('copy');
export let queueCommand = writable(null);
export let searchResults = writable([]);
export let runHistory = writable([]);

// Track visibility of the Start Menu
export let startMenuOpen = writable(false);

// Theme selection
export let theme = writable('lunaBlue');

// Current logged in user
export let currentUser = writable(null);
// Stored user profiles
export let users = writable([]);

// Apply the initial theme
applyTheme(themes['lunaBlue']);

// Update CSS variables when the theme changes
theme.subscribe(value => {
    if (themes[value]) {
        applyTheme(themes[value]);
    }
});

// Load user profiles from IndexedDB
export async function loadUsers() {
    let stored = await get('users');
    if (!stored) {
        stored = [{ id: 1, name: 'User', password: '', avatar: '/images/xp/icons/UserAccounts.png' }];
        await set('users', stored);
    }
    users.set(stored);

    const current = await get('current_user');
    if (current) {
        currentUser.set(current);
    }
}

// Persist users and current user when they change
users.subscribe(value => {
    set('users', value);
});

currentUser.subscribe(value => {
    set('current_user', value);
});

