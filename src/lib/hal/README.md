# Hardware Abstraction Layer (HAL)

This package exposes a minimal hardware abstraction layer for kernel modules.
It simulates basic hardware components using Node.js primitives so that code can
interact with "hardware" without requiring access to real devices.

## API

### `readPort(port: number): number`
Read the value from a simulated I/O port. Ports default to `0` if nothing was
written.

### `writePort(port: number, value: number): void`
Write a value to a simulated I/O port.

### `interruptController`
Object used to register and trigger interrupt handlers.

- `register(irq: string, handler: Function): void`
  Register a handler for a given interrupt request number.
- `trigger(irq: string, ...args: any[]): void`
  Trigger a registered interrupt and pass arguments to the handler.
- `clear(irq: string): void`
  Remove a registered interrupt handler.

### `timer`
Provides wrappers around the Node.js timer functions.

- `setTimeout(fn: Function, ms: number): Timeout`
- `clearTimeout(id: Timeout): void`

### `powerManagement`
Simple interface to manage the simulated power state.

- `shutdown(): void`
- `reboot(): void`
- `getState(): string` – returns the current power state (`"on"`, `"off"`, or
  `"rebooting"`).

These interfaces are designed to be imported by kernel modules to interact with
simulated hardware in a consistent way.
