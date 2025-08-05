import { createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import * as utils from "../lib/utils";

export default function HardwareManager() {
  const navigate = useNavigate();
  const config = utils.get_hardware_settings();
  const [ram, setRam] = createSignal(config.ram);
  const [cores, setCores] = createSignal(config.cores);

  const save = () => {
    utils.set_hardware_settings({ ram: ram(), cores: cores() });
    navigate("/boot_manager");
  };

  onMount(() => {
    utils.set_theme("none");
  });

  return (
    <div class="w-screen h-screen bg-black text-slate-100 font-MSSS p-8">
      <h1 class="text-xl mb-4">Hardware Manager</h1>
      <div class="mb-4">
        <label class="block mb-1" for="ram">RAM (MB)</label>
        <input
          id="ram"
          type="number"
          min="16"
          max="8192"
          value={ram()}
          onInput={(e) => setRam(Math.min(8192, Math.max(16, Number(e.currentTarget.value))))}
          class="text-slate-900 p-1"
        />
      </div>
      <div class="mb-4">
        <label class="block mb-1" for="cores">CPU Cores</label>
        <input
          id="cores"
          type="number"
          min="1"
          max="4"
          value={cores()}
          onInput={(e) => setCores(Math.min(4, Math.max(1, Number(e.currentTarget.value))))}
          class="text-slate-900 p-1"
        />
      </div>
      <button class="mt-4 px-4 py-2 bg-slate-200 text-slate-900" onClick={save}>
        Save
      </button>
    </div>
  );
}
