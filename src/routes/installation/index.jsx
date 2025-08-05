import { createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import * as utils from "../../lib/utils";

export default function Installation() {
  const navigate = useNavigate();
  const [progress, setProgress] = createSignal(0);
  const steps = [
    "Setup is loading files...",
    "Setup is starting Windows...",
    "Preparing installation...",
    "Installing Windows...",
    "Finalizing installation..."
  ];

  onMount(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setProgress(tick * 20);
      if (tick >= 5) {
        clearInterval(interval);
        utils.set_windows_installed(true);
        utils.set_installing_windows(false);
        navigate("/xp/login");
      }
    }, 1000);
  });

  const message = () => steps[Math.min(steps.length - 1, Math.floor(progress() / 20))];

  return (
    <div class="w-screen h-screen bg-[#002a80] text-white font-MSSS flex flex-col items-center justify-center">
      <h1 class="text-2xl mb-4">Windows XP Setup</h1>
      <p class="mb-4">{message()}</p>
      <div class="w-64 h-4 bg-black">
        <div class="h-full bg-green-500" style={{ width: `${progress()}%` }} />
      </div>
    </div>
  );
}
