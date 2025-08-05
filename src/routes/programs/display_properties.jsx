import { For } from "solid-js";
import { set } from "idb-keyval";
import { default_wallpapers } from "../../lib/system";
import { wallpaper, setWallpaper, theme, setTheme } from "../../lib/store";
import { themes } from "../../lib/themes";

export default function DisplayProperties() {
  async function apply(path) {
    setWallpaper(path);
    if (typeof indexedDB !== "undefined") {
      await set("wallpaper", path);
    }
  }

  return (
    <div class="p-4 text-sm space-y-4">
      <div>
        <div class="mb-2 font-semibold">Themes</div>
        <div class="flex gap-2 flex-wrap">
          <For each={Object.entries(themes)}>
            {([key, t]) => (
              <button
                class={`px-2 py-1 border ${theme() === key ? "border-blue-500" : "border-gray-300"}`}
                onClick={() => setTheme(key)}
              >
                {t.name}
              </button>
            )}
          </For>
        </div>
      </div>

      <div>
        <div class="mb-2 font-semibold">Wallpapers</div>
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
    </div>
  );
}

