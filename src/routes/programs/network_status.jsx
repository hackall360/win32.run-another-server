import { createSignal, onCleanup, onMount, Show } from "solid-js";

export default function NetworkStatus() {
  const [online, setOnline] = createSignal(navigator.onLine);
  const [connection, setConnection] = createSignal({});

  const updateStatus = () => setOnline(navigator.onLine);
  const updateConnection = () => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    setConnection(c ? { effectiveType: c.effectiveType, downlink: c.downlink, rtt: c.rtt } : {});
  };

  onMount(() => {
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c) {
      c.addEventListener("change", updateConnection);
    }
    updateConnection();
  });

  onCleanup(() => {
    window.removeEventListener("online", updateStatus);
    window.removeEventListener("offline", updateStatus);
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c) {
      c.removeEventListener("change", updateConnection);
    }
  });

  return (
    <div class="p-4 text-sm space-y-1">
      <div>Status: {online() ? "Online" : "Offline"}</div>
      <Show when={connection().effectiveType}>
        <div>Connection type: {connection().effectiveType}</div>
        <div>Downlink: {connection().downlink}Mb/s</div>
        <div>RTT: {connection().rtt}ms</div>
      </Show>
    </div>
  );
}

