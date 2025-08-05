import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import * as utils from "../lib/utils";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    if (utils.is_windows_installed()) {
      navigate("/boot_manager");
    } else {
      utils.set_installing_windows(true);
      navigate("/installation");
    }
  });

  return (
    <main class="p-4">
      <h1 class="text-2xl">WIN32.run Solid</h1>
      <a href="/boot_manager" class="text-blue-500 underline">Boot</a>
    </main>
  );
}
