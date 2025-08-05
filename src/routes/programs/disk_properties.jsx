import { createSignal, onMount } from "solid-js";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default function DiskProperties() {
  const [info, setInfo] = createSignal({ usage: 0, quota: 0 });

  onMount(async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      setInfo({ usage, quota });
    }
  });

  const used = () => formatBytes(info().usage);
  const total = () => formatBytes(info().quota);
  const free = () => formatBytes(info().quota - info().usage);
  const percent = () =>
    info().quota ? ((info().usage / info().quota) * 100).toFixed(2) : "0";

  return (
    <div class="p-4 text-sm space-y-1">
      <div>Total space: {total()}</div>
      <div>Used space: {used()}</div>
      <div>Free space: {free()}</div>
      <div>Usage: {percent()}%</div>
    </div>
  );
}

