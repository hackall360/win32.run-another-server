import { createSignal, For, Show } from "solid-js";
import JSZip from "jszip";

export default function Zip() {
  const [entries, setEntries] = createSignal([]);

  async function handleFile(e) {
    const file = e.currentTarget.files[0];
    if (!file) return;
    const zip = await JSZip.loadAsync(file);
    setEntries(Object.keys(zip.files));
  }

  return (
    <div class="p-4 text-sm space-y-2">
      <input type="file" accept=".zip" onChange={handleFile} />
      <Show when={entries().length}>
        <ul class="mt-2 list-disc ml-4">
          <For each={entries()}>{(name) => <li>{name}</li>}</For>
        </ul>
      </Show>
    </div>
  );
}

