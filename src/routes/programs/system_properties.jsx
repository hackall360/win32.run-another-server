import { createSignal, onMount } from "solid-js";

export default function SystemProperties() {
  const [info, setInfo] = createSignal({
    platform: "",
    userAgent: "",
    cores: "",
    memory: "",
    resolution: "",
    language: ""
  });

  onMount(() => {
    setInfo({
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      cores: navigator.hardwareConcurrency ? navigator.hardwareConcurrency.toString() : "Unknown",
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "Unknown",
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language
    });
  });

  return (
    <div class="p-4 text-sm space-y-1">
      <div>Platform: {info().platform}</div>
      <div>User agent: {info().userAgent}</div>
      <div>CPU cores: {info().cores}</div>
      <div>Memory: {info().memory}</div>
      <div>Screen resolution: {info().resolution}</div>
      <div>Language: {info().language}</div>
    </div>
  );
}

