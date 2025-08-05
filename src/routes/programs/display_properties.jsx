import { For } from "solid-js";
import { set } from "idb-keyval";
import { default_wallpapers } from "../../lib/system";
import { wallpaper, setWallpaper } from "../../lib/store";

export default function DisplayProperties() {
  async function apply(path) {
    setWallpaper(path);
    if (typeof indexedDB !== "undefined") {
      await set("wallpaper", path);
    }
  }

  return (
    <div class="p-4 text-sm">
      <div class="grid grid-cols-3 gap-2">
        <For each={default_wallpapers}>
          {(wp) => (
            <button
              class={`border p-1 text-left ${wallpaper() === wp.path ? "border-blue-500" : "border-gray-300"}`}
              onClick={() => apply(wp.path)}
            >
              <img src={wp.path} alt={wp.name} class="w-24 h-16 object-cover" />
              <div class="mt-1">{wp.name}</div>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

