import { createSignal, Show } from "solid-js";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export default function Properties() {
  const [file, setFile] = createSignal();

  return (
    <div class="p-4 text-sm space-y-2">
      <input type="file" onChange={(e) => setFile(e.currentTarget.files[0])} />
      <Show when={file()}>
        <div>Name: {file().name}</div>
        <div>Size: {formatBytes(file().size)}</div>
        <div>Type: {file().type || "Unknown"}</div>
        <div>Last modified: {file().lastModified ? new Date(file().lastModified).toLocaleString() : ""}</div>
      </Show>
    </div>
  );
}

