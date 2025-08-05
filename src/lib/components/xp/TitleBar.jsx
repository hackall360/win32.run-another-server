import { createSignal, mergeProps } from "solid-js";

export default function TitleBar(initialProps) {
  const props = mergeProps({
    options: {},
    inactive: false,
    maximized: false,
    on_click_maximize: () => {},
    on_click_minimize: () => {},
    on_click_close: () => {}
  }, initialProps);

  const [opts, setOpts] = createSignal({
    close_btn: true,
    maximize_btn: true,
    minimize_btn: true,
    close_btn_disabled: false,
    maximize_btn_disabled: false,
    minimize_btn_disabled: false,
    ...props.options
  });

  const api = {
    update_icon(icon) {
      setOpts({ ...opts(), icon });
    },
    update_title(title) {
      setOpts({ ...opts(), title });
    }
  };
  props.ref && props.ref(api);

  const o = opts;

  return (
    <div
      class={`titlebar shrink-0 flex rounded-tl-lg rounded-tr-lg items-center justify-between h-7 p-1 font-Trebuchet ${
        props.inactive
          ? "bg-[linear-gradient(var(--titlebar-gradient-inactive))]"
          : "bg-[linear-gradient(var(--titlebar-gradient))]"
      }`}
    >
      {o().icon && <img src={o().icon} width="20" height="20" class="ml-1" alt="" />}
      <p class="text-white font-semibold mr-4 text-[12px] grow ml-1 leading-tight line-clamp-1 text-ellipsis">
        {o().title}
      </p>
      <div class="flex mr-0.5 shrink-0">
        {o().minimize_btn && (
          <button
            disabled={o().minimize_btn_disabled}
            onClick={props.on_click_minimize}
            class="group w-5 h-5 ml-1 group"
          >
            <img
              src="/images/xp/icons/Minimize.png"
              class={`w-full h-full ${
                o().minimize_btn_disabled ? "contrast-75" : "group-hover:brightness-110"
              }`}
            />
          </button>
        )}
        {o().maximize_btn && (
          <button
            disabled={o().maximize_btn_disabled}
            onClick={props.on_click_maximize}
            class="group w-5 h-5 ml-1 group"
          >
            {props.maximized ? (
              <img
                src="/images/xp/icons/Restore.png"
                class={`w-full h-full ${
                  o().maximize_btn_disabled ? "contrast-75" : "group-hover:brightness-110"
                }`}
              />
            ) : (
              <img
                src="/images/xp/icons/Maximize.png"
                class={`w-full h-full ${
                  o().maximize_btn_disabled ? "contrast-75" : "group-hover:brightness-110"
                }`}
              />
            )}
          </button>
        )}
        {o().close_btn && (
          <button
            disabled={o().close_btn_disabled}
            onClick={props.on_click_close}
            class="group w-5 h-5 ml-1 group"
          >
            <img
              src="/images/xp/icons/Exit.png"
              class={`w-full h-full ${
                o().close_btn_disabled ? "contrast-75" : "group-hover:brightness-110"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
