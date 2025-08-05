import { For } from "solid-js";
import { setQueueProgram } from "../../lib/store";

export default function ControlPanel() {
  const items = [
    {
      name: "Display",
      icon: "/images/xp/icons/DisplayProperties.png",
      path: "./programs/display_properties.jsx"
    },
    {
      name: "Network",
      icon: "/images/xp/icons/NetworkConnections.png",
      path: "./programs/network_status.jsx"
    },
    {
      name: "Windows Update",
      icon: "/images/xp/icons/WindowsUpdate.png",
      path: "./programs/windows_update.jsx"
    },
    {
      name: "Safely Remove Hardware",
      icon: "/images/xp/icons/SafelyRemoveHardware.png",
      path: "./programs/safely_remove_hardware.jsx"
    }
  ];

  return (
    <div class="p-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
        <For each={items}>{(item) => (
          <div
            class="flex flex-col items-center text-center cursor-pointer select-none p-2 hover:bg-[rgb(122,150,223)] hover:text-white rounded"
            onClick={() =>
              setQueueProgram({
                name: item.name,
                icon: item.icon,
                path: item.path
              })
            }
          >
            <img
              src={item.icon}
              alt={item.name}
              width="32"
              height="32"
              class="pointer-events-none"
            />
            <span class="mt-2">{item.name}</span>
          </div>
        )}</For>
      </div>
    </div>
  );
}
