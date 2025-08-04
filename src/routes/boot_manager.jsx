import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import * as utils from "../lib/utils";

export default function BootManager() {
  const navigate = useNavigate();
  const [isChromium, setIsChromium] = createSignal(true);
  const [currentOption, setCurrentOption] = createSignal(0);
  const [selected, setSelected] = createSignal(false);

  const bootOptions = [
    "Start Windows Normally",
    "Install Windows",
    "Onboard NIC (IPV4)",
    "Onboard NIC (IPV6",
    "BIOS Setup",
    "Device Configuration",
    "BIOS Flash Update",
    "Change Boot Mode Settings"
  ];

  const onKeyPressed = (e) => {
    switch (e.key) {
      case "ArrowUp":
        setCurrentOption((o) => (o === 0 ? bootOptions.length - 1 : o - 1));
        break;
      case "ArrowDown":
        setCurrentOption((o) => (o === bootOptions.length - 1 ? 0 : o + 1));
        break;
      case "Enter":
        boot();
        break;
    }
  };

  const boot = () => {
    if (selected()) return;
    setSelected(true);
    if (currentOption() === 0) {
      utils.set_installing_windows(false);
      navigate("/xp/login");
    } else if (currentOption() === 1) {
      utils.set_installing_windows(true);
      navigate("/installation/dos/starting");
    }
  };

  onMount(() => {
    utils.set_theme("none");
    setIsChromium(window.chrome != null);
    window.addEventListener("keydown", onKeyPressed);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", onKeyPressed);
  });

  return (
    <div class="w-screen h-screen bg-black overflow-hidden font-MSSS">
      <div class="mt-12 ml-8 text-lg">
        <p class="text-slate-100">
          Use the ↑(Up) and ↓(Down) key to move the pointer to desired boot device.
        </p>
        <p class="text-slate-100">Press (Enter) to attempt to boot or ESC to cancel.</p>
        <Show when={!isChromium()}>
          <p class="text-slate-100 mt-2 max-w-[500px]">
            WIN32.RUN might have unexpected behaviors on browsers that are NOT Chromium-based (Safari, Firefox, Internet Explorer, etc.)
          </p>
        </Show>

        <p class="text-slate-100 uppercase mt-4 mb-2">boot options:</p>
        <For each={bootOptions.slice(0, 4)}>{(option, i) => (
          <div>
            <div
              class={`ml-8 p-2 inline-block ${i() === currentOption() ? "text-slate-900 bg-slate-200" : "text-slate-300"}`}
              onClick={() => {
                setCurrentOption(i());
                boot();
              }}
            >
              {option}
            </div>
          </div>
        )}</For>

        <p class="text-slate-100 uppercase mt-4 mb-2">other options:</p>
        <For each={bootOptions.slice(4)}>{(option, i) => (
          <div>
            <div
              class={`ml-8 p-2 inline-block ${i() + 4 === currentOption() ? "text-slate-900 bg-slate-200" : "text-slate-300"}`}
              onClick={() => setCurrentOption(i() + 4)}
            >
              {option}
            </div>
          </div>
        )}</For>
      </div>
    </div>
  );
}
