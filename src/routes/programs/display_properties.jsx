import { For } from "solid-js";
import { set } from "idb-keyval";
import { default_wallpapers } from "../../lib/system";
import { screensavers } from "../../lib/screensavers";
import {
  wallpaper,
  setWallpaper,
  theme,
  setTheme,
  screensaver,
  setScreensaver,
  screensaverTimeout,
  setScreensaverTimeout,
} from "../../lib/store";
import { themes } from "../../lib/themes";

export default function DisplayProperties() {
  async function apply(path) {
    setWallpaper(path);
    if (typeof indexedDB !== "undefined") {
      await set("wallpaper", path);
    }
  }

  function preview() {
    const ss = screensaver();
    if (ss) {
      window.open(`/screensaver?src=${encodeURIComponent(ss)}`, "_blank");
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

      <div>
        <div class="mb-2 font-semibold">Screen Saver</div>
        <div class="flex items-center gap-2">
          <select
            class="border p-1"
            value={screensaver() ?? ""}
            onInput={(e) => setScreensaver(e.currentTarget.value || null)}
          >
            <For each={screensavers}>
              {(ss) => <option value={ss.path ?? ""}>{ss.name}</option>}
            </For>
          </select>
          <button class="px-2 py-1 border border-gray-300" onClick={preview}>
            Preview
          </button>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <span>Wait</span>
          <input
            type="number"
            min="1"
            class="border p-1 w-16"
            value={screensaverTimeout()}
            onInput={(e) => setScreensaverTimeout(parseInt(e.currentTarget.value))}
          />
          <span>minutes</span>
        </div>
      </div>
    </div>
  );
}

