import { createSignal } from "solid-js";

export default function SafelyRemoveHardware() {
  const [message] = createSignal("No removable devices detected.");
  return <div class="p-4 text-sm">{message()}</div>;
}

