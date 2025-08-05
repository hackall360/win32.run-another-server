import { createSignal, For, Show } from "solid-js";
import { Archive } from "../../lib/libarchive.js/main.js";

export default function WinRAR() {
  const [entries, setEntries] = createSignal([]);

  async function handleFile(e) {
    const file = e.currentTarget.files[0];
    if (!file) return;
    await Archive.init();
    const archive = await Archive.open(file);
    const arr = await archive.getFilesArray();
    setEntries(arr.map((item) => item.path + (item.file.name || item.file)));
  }

  return (
    <div class="p-4 text-sm space-y-2">
      <input type="file" accept=".rar,.zip" onChange={handleFile} />
      <Show when={entries().length}>
        <ul class="mt-2 list-disc ml-4">
          <For each={entries()}>{(name) => <li>{name}</li>}</For>
        </ul>
      </Show>
    </div>
  );
}

