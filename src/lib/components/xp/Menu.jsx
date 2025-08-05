import { createSignal, onCleanup } from "solid-js";

export default function Menu(props) {
  const menu = props.menu ?? [];
  const [active, setActive] = createSignal(false);
  let ref;

  const handleOutside = (e) => {
    if (ref && !ref.contains(e.target)) setActive(false);
  };
  document.addEventListener("click", handleOutside, true);
  onCleanup(() => document.removeEventListener("click", handleOutside, true));

  const hide = () => setActive(false);

  return (
    <div
      ref={ref}
      class="toolbar-menu flex flex-row items-center justify-evenly w-min font-MSSS z-10"
      style={props.style}
    >
      {menu.map((menu_group) => (
        <div class="text-[11px]  text-slate-900 hover:bg-blue-600 hover:text-slate-50 relative group">
          <div class="px-2 py-1" onClick={() => setActive(true)}>
            {menu_group.name}
          </div>
          {menu_group.items && (
            <div
              class={`absolute w-[150px] border-slate-500 shadow hidden ${
                active() ? "group-hover:block" : "inactive-class"
              } border border-slate-200 bg-slate-50 left-0 top-[25px]`}
            >
              {menu_group.items.map((item_group, group_index) => (
                <div
                  class={`w-full border-slate-200 ${
                    group_index === menu_group.items.length - 1 ? "" : "border-b"
                  }`}
                >
                  {item_group.map((item) => (
                    <div
                      class={`py-1 w-full flex flex-row items-center ${
                        item.disabled ? "" : "hover:bg-blue-600"
                      } relative group-sub`}
                      onClick={() => {
                        if (!item.disabled) {
                          hide();
                          item.action && item.action();
                        }
                      }}
                    >
                      <div class="w-[20px] ml-1 shrink-0">
                        {item.icon && <img src={item.icon} width="17" height="17" />}
                      </div>
                      <div
                        class={`grow text-slate-900 ${
                          item.font === "bold" ? "font-bold" : ""
                        } ${
                          item.disabled
                            ? "text-slate-400"
                            : "group-sub-hover:text-slate-50"
                        }`}
                      >
                        <p class="line-clamp-1">{item.name}</p>
                      </div>
                      <div class="w-[10px]" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
