### Windows XP in the browser, with a File System, programs, XP-style File Picker and Saver dialogs, 3rd-party program, etc.
## [🍭 win32.run](https://win32.run)

**win32.run is actively developed.** We welcome issues, feature requests, and pull requests—see [CONTRIBUTING.md](CONTRIBUTING.md) to get involved.

![License Unlicense](https://badgen.net/badge/license/Unlicense/green)
[![css tailwind](https://badgen.net/badge/css/tailwind/blue)](https://github.com/tailwindlabs/tailwindcss)
[![js framework solid](https://badgen.net/badge/built/solid/blue)](https://github.com/solidjs/solid)

#
https://user-images.githubusercontent.com/5462728/218907749-22ddea15-8761-4cf3-b162-e2817c0f9db8.mp4
#
*Microsoft and Windows XP trademarks & logos definitely belong to Microsoft Corporation. All the programs' names and logos (Foxit, Word, WinRar, Internet Explorer, etc.) are of their rightful copyright holders. **win32.run** is purely for the **purpose of nostalgia**. I have no intent and no right to monetize  **win32.run**, but you may occasionally see ads when playing third-party games.*

# Project Status

win32.run is under active development with new features and improvements landing regularly. Community feedback and contributions guide the project's direction, so please feel free to [open an issue](https://github.com/ducbao414/win32.run-another-server/issues) or submit a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

# Introduction
## 🦄 It's for nostalgia's sake!

**WIN32.RUN** runs solely on the client-side (the user's browser). All files are processed right in the user's browser. There is no file uploading, no server-side processing (cause I'm broke, can't afford it). Each user has his own OS session (just like the good old Windows XP)

Files (and Folders) in win32.run are stored locally in IndexedDB. Apps (and 3rd-party apps) can interact with files through win32.run homemade file picker and saver dialog (with Windows XP appearance).
## Built with
WIN32.RUN is built with [SolidJS](https://github.com/solidjs/solid)/[Solid Start](https://github.com/solidjs/solid-start) and [Tailwindcss](https://github.com/tailwindlabs/tailwindcss).
Solid provides a lightweight React-like developer experience with fine-grained reactivity and JSX.

## Kernel API

win32.run now includes a minimal JavaScript kernel located at `src/lib/kernel.js`. The kernel
allows programs to be installed and launched at runtime and exposes a simple subsystem registry
that other features can build on top of.

```javascript
import kernel from './lib/kernel';

kernel.installProgram({ id: 'demo', name: 'Demo', path: './programs/demo.jsx' });
kernel.launchProgram('demo');
```

Subsystems can extend the kernel:

```javascript
kernel.registerSubsystem('theme', { apply: name => {/* ... */} });
```

These hooks provide a starting point for enhancing the authenticity of the emulated Windows XP
environment.

# Run, build & deploy
I deploy it on a $5 Vultr instance, there's no special hardware and dependencies requirement here, except Node.js (and NPM).

The project is built with Solid and Solid Start.
## 📦 Install dependencies
Clone or download from Github
```shell
git clone https://github.com/ducbao414/win32.run.git
cd win32.run-main
```
Then install dependencies
```shell
npm install
```
## Run
```shell
npm run dev
```
The dev server is at http://localhost:3000
## Build
```shell
npm run build
```
The build output is written to `dist/` and `.solid/`.
To run the built server
```shell
npm start
```
## Deploy
I shamelessly share my deployment process.

Follow [this guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04) to set up a Ubuntu server with NGINX. I chose Vultr since theirs is cheaper than DigitalOcean's ($5 vs $6).

Put the build output (`dist` and `.solid`), `package.json`, and `package-lock.json` on the server, `cd` then `npm install`.

Finally, run `npm start` (or use a process manager like `pm2 start .solid/server/server.js`) to serve win32 at `localhost:3000`.
# Documentation
If you're interested in expanding or customizing win32.run, please have a look at its documentation. Contributions and suggestions for improving the docs are always welcome.

[![Please visit docs.win32.run](https://img.shields.io/badge/view-Documentation-blue?style=for-the-badge)](https://docs.win32.run)

## Contributing

Contributions are welcome! Whether it's reporting bugs, improving documentation, or submitting new features, your help is appreciated. We love seeing new contributors—look for issues labeled **good first issue** or bring your own ideas. Please read [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to get involved.
