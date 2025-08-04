import { writable } from "svelte/store";
import { default_wallpapers } from './system';
import { themes, applyTheme } from './themes';

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

// Apply the initial theme
applyTheme(themes['lunaBlue']);

// Update CSS variables when the theme changes
theme.subscribe(value => {
    if (themes[value]) {
        applyTheme(themes[value]);
    }
});

