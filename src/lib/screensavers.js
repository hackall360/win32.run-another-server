export const screensavers = [
  { name: 'None', path: null },
  ...Array.from({ length: 12 }, (_, i) => ({
    name: `Screensaver ${i + 1}`,
    path: `/html/visualizers/${i + 1}.html`
  }))
];
