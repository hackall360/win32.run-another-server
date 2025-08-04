// Theme definitions for Windows XP Luna color schemes
// Each theme maps custom properties used throughout the UI

export const themes = {
    lunaBlue: {
        name: 'Luna Blue',
        'xp-gradient': 'rgb(31, 47, 134) 0px, rgb(49, 101, 196) 3%, rgb(54, 130, 229) 6%, rgb(68, 144, 230) 10%, rgb(56, 131, 229) 12%, rgb(43, 113, 224) 15%, rgb(38, 99, 218) 18%, rgb(35, 91, 214) 20%, rgb(34, 88, 213) 23%, rgb(33, 87, 214) 38%, rgb(36, 93, 219) 54%, rgb(37, 98, 223) 86%, rgb(36, 95, 220) 89%, rgb(33, 88, 212) 92%, rgb(29, 78, 192) 95%, rgb(25, 65, 165) 98%',
        'titlebar-gradient': '180deg,#0997ff,#0053ee 8%,#0050ee 40%,#06f 88%,#06f 93%,#005bff 95%,#003dd7 96%,#003dd7',
        'titlebar-gradient-inactive': 'rgb(118, 151, 231) 0%, rgb(126, 158, 227) 3%, rgb(148, 175, 232) 6%, rgb(151, 180, 233) 8%, rgb(130, 165, 228) 14%, rgb(124, 159, 226) 17%, rgb(121, 150, 222) 25%, rgb(123, 153, 225) 56%, rgb(130, 169, 233) 81%, rgb(128, 165, 231) 89%, rgb(123, 150, 225) 94%, rgb(122, 147, 223) 97%, rgb(171, 186, 227) 100%',
        'window-box-shadow-inactive': 'inset -1px -1px rgb(130, 165, 228), inset 1px 1px rgb(130, 165, 228), inset -2px -2px rgb(130, 165, 228), inset 2px 2px rgb(130, 165, 228), inset -3px -3px rgb(130, 165, 228), inset 3px 3px rgb(130, 165, 228)',
        'window-box-shadow': 'inset -1px -1px #424fa2, inset 1px 1px #4e68d1, inset -2px -2px #5669c0, inset 2px 2px #528eef, inset -3px -3px #4e73d7, inset 3px 3px #5284da',
        'tile-box-shadow': 'rgb(0 0 0 / 30%) -1px 0px inset, rgb(255 255 255 / 20%) 1px 1px 1px inset',
        'tile-box-shadow-focus': 'rgb(0 0 0 / 20%) 0px 0px 1px 1px inset, rgb(0 0 0 / 70%) 1px 0px 1px inset'
    },
    lunaOlive: {
        name: 'Luna Olive',
        'xp-gradient': 'rgb(84, 96, 43) 0%, rgb(176, 196, 128) 100%',
        'titlebar-gradient': '180deg,#c5d39e,#96aa39 8%,#82a20b 40%,#8ba80c 88%,#8aa70b 93%,#778f00 95%,#5c7f00 96%,#4b6b00',
        'titlebar-gradient-inactive': 'rgb(204, 214, 171) 0%, rgb(182, 198, 144) 100%',
        'window-box-shadow-inactive': 'inset -1px -1px #c5d39e, inset 1px 1px #c5d39e, inset -2px -2px #c5d39e, inset 2px 2px #c5d39e, inset -3px -3px #c5d39e, inset 3px 3px #c5d39e',
        'window-box-shadow': 'inset -1px -1px #6e7d23, inset 1px 1px #90a854, inset -2px -2px #7a8e2d, inset 2px 2px #a4c359, inset -3px -3px #8ea73a, inset 3px 3px #94b13e',
        'tile-box-shadow': 'rgb(0 0 0 / 30%) -1px 0px inset, rgb(255 255 255 / 20%) 1px 1px 1px inset',
        'tile-box-shadow-focus': 'rgb(0 0 0 / 20%) 0px 0px 1px 1px inset, rgb(0 0 0 / 70%) 1px 0px 1px inset'
    },
    lunaSilver: {
        name: 'Luna Silver',
        'xp-gradient': 'rgb(125, 125, 125) 0%, rgb(180, 180, 180) 100%',
        'titlebar-gradient': '180deg,#d7d7e6,#7f7fbc 8%,#7a7ab3 40%,#8181c5 88%,#8080c4 93%,#7070b2 95%,#6161a0 96%,#51518f',
        'titlebar-gradient-inactive': 'rgb(204, 204, 204) 0%, rgb(187, 187, 187) 100%',
        'window-box-shadow-inactive': 'inset -1px -1px #d7d7e6, inset 1px 1px #d7d7e6, inset -2px -2px #d7d7e6, inset 2px 2px #d7d7e6, inset -3px -3px #d7d7e6, inset 3px 3px #d7d7e6',
        'window-box-shadow': 'inset -1px -1px #9d9dbb, inset 1px 1px #bfbfd7, inset -2px -2px #b3b3d1, inset 2px 2px #c9c9e1, inset -3px -3px #b1b1d4, inset 3px 3px #b7b7d8',
        'tile-box-shadow': 'rgb(0 0 0 / 30%) -1px 0px inset, rgb(255 255 255 / 20%) 1px 1px 1px inset',
        'tile-box-shadow-focus': 'rgb(0 0 0 / 20%) 0px 0px 1px 1px inset, rgb(0 0 0 / 70%) 1px 0px 1px inset'
    }
};

// Apply the given theme by writing CSS variables to the :root element
export function applyTheme(theme) {
    if (typeof document === 'undefined' || !theme) return;
    Object.entries(theme).forEach(([key, value]) => {
        if (key === 'name') return;
        document.documentElement.style.setProperty(`--${key}`, value);
    });
}

