# win32.run Documentation

Welcome to the developer documentation for **win32.run**. This project is an in-browser recreation of Windows XP built with SolidJS and Tailwind CSS.

## Getting Started
- Install dependencies with `npm install`.
- Start the development server with `npm run dev` (http://localhost:3000).
- Build for production with `npm run build` and serve via `npm start`.

## Project Architecture
win32.run runs entirely in the browser. A minimal JavaScript kernel in [`src/lib/kernel.js`](../src/lib/kernel.js) lets programs register and launch at runtime and provides extension points for subsystems.

## API
For details on interacting with win32.run from third-party programs, see [api.md](api.md).

## Contributing
Feedback and pull requests are welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on how to get involved.
