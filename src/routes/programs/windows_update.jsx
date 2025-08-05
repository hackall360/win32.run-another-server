import { createSignal } from "solid-js";

export default function WindowsUpdate() {
  const [status, setStatus] = createSignal("Click 'Check for updates' to begin.");

  function checkUpdates() {
    setStatus("Checking for updates...");
    setTimeout(() => {
      setStatus("No new updates are available.");
    }, 1000);
  }

  return (
    <div class="p-4 text-sm space-y-2">
      <button class="px-2 py-1 border" onClick={checkUpdates}>
        Check for updates
      </button>
      <div>{status()}</div>
    </div>
  );
}

