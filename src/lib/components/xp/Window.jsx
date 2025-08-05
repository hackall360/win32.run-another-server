import { createSignal, onMount, onCleanup } from "solid-js";
import { get, set } from "idb-keyval";
import TitleBar from "./TitleBar.jsx";
import { zIndex, setZIndex, runningPrograms, setRunningPrograms } from "../../store.js";

export default function Window(props) {
  let titlebar;
  let node_ref;
  let saved_position;
  const [maximized, setMaximized] = createSignal(props.maximized);
  const [minimized, setMinimized] = createSignal(props.minimized);
  const [translateX, setTranslateX] = createSignal("");
  const [translateY, setTranslateY] = createSignal("");
  const [animation_enabled, setAnimationEnabled] = createSignal(false);
  const [localZ, setLocalZ] = createSignal(0);

  const clickOutside = (el, accessor) => {
    const handler = (e) => {
      if (el && !el.contains(e.target)) accessor()?.(e);
    };
    document.addEventListener("mousedown", handler, true);
    onCleanup(() => document.removeEventListener("mousedown", handler, true));
  };

  onMount(async () => {
    if (props.options.exec_path != null) {
      let rect = await get(props.options.exec_path);
      if (rect) {
        rect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        let workspace = document.querySelector('#work-space');
        let nudge = calc_nudges(rect);
        rect.top += nudge.top;
        rect.left += nudge.left;
        if (rect.left + rect.width <= workspace.offsetWidth && rect.top + rect.height <= workspace.offsetHeight) {
          props.options.top = rect.top;
          props.options.left = rect.left;
          props.options.width = rect.width;
          props.options.height = rect.height;
        }
      }
    }
    if (props.options.top == null) {
      props.options.top = (node_ref.parentNode.offsetHeight - node_ref.offsetHeight)/2;
    }
    if (props.options.left == null) {
      props.options.left = (node_ref.parentNode.offsetWidth - node_ref.offsetWidth)/2;
    }
    set_position({ top: props.options.top, left: props.options.left, width: props.options.width, height: props.options.height });
    if (props.options.resizable == null) props.options.resizable = true;
    if (props.options.draggable == null) props.options.draggable = true;
    setup_gestures();
    setZIndex(zIndex() + 1);
    setLocalZ(zIndex());
    node_ref.style.removeProperty('opacity');
    setTimeout(() => setAnimationEnabled(true), 500);
  });

  const on_click_close = () => { props.on_click_close && props.on_click_close(); };

  const on_click_maximize = () => {
    if (!props.options.resizable) return;
    setMinimized(false);
    if (maximized()) {
      set_position(saved_position);
      setMaximized(false);
    } else {
      saved_position = { top: node_ref.offsetTop, left: node_ref.offsetLeft, width: node_ref.offsetWidth, height: node_ref.offsetHeight };
      set_position({ top: 0, left: 0, width: node_ref.parentNode.offsetWidth, height: node_ref.parentNode.offsetHeight });
      setMaximized(true);
    }
    focus();
  };

  const on_click_minimize = () => {
    const window_center = get_center_point(node_ref.getBoundingClientRect());
    const tile_center = get_center_point(document.querySelector(`.program-tile[program-id="${props.options.id}"]`)?.getBoundingClientRect());
    setTranslateX(`translateX(${tile_center.x - window_center.x}px)`);
    setTranslateY(`translateY(${tile_center.y - window_center.y}px)`);
    setMinimized(true);
    loose_focus();
  };

  function restore() {
    if (minimized()) {
      setMinimized(false);
    } else if (maximized()) {
      on_click_maximize();
    }
    focus();
  }

  function focus() {
    if (localZ() !== zIndex()) {
      setZIndex(zIndex() + 1);
      setLocalZ(zIndex());
      props.on_focused && props.on_focused();
    }
  }

  function loose_focus() {
    if (localZ() === zIndex()) {
      setZIndex(zIndex() + 1);
    }
  }

  function calc_nudges({ top, left, width, height }) {
    const existing_window = runningPrograms().findLast(
      (el) => el.options.id !== props.options.id && el.options.exec_path === props.options.exec_path
    );
    if (existing_window == null) return { top: 0, left: 0 };
    const pad = 10;
    const nudges = [
      [pad, pad],
      [pad, -pad],
      [-pad, pad],
      [-pad, -pad],
      [0, 0]
    ];
    const workspace = document.querySelector('#work-space');
    for (let nudge of nudges) {
      if (
        top + nudge[0] >= 0 &&
        left + nudge[1] >= 0 &&
        top + height + nudge[0] <= workspace.offsetHeight &&
        left + width + nudge[1] <= workspace.offsetWidth
      ) {
        return { top: nudge[0], left: nudge[1] };
      }
    }
    return { top: 0, left: 0 };
  }

  function get_center_point(rect) {
    if (rect == null) {
      return { x: document.body.offsetWidth * 0.5, y: document.body.offsetHeight * 0.5 };
    }
    return { x: rect.x + rect.width * 0.5, y: rect.y + rect.height * 0.5 };
  }

  function set_position({ top, left, width, height }) {
    node_ref.style.top = `${top}px`;
    node_ref.style.left = `${left}px`;
    node_ref.style.width = `${width}px`;
    node_ref.style.height = `${height}px`;
    if (props.options.exec_path) {
      set(props.options.exec_path, node_ref.getBoundingClientRect());
    }
  }

  function setup_gestures() {
    if (props.options.draggable) {
      window.jQuery(node_ref).draggable({
        containment: 'parent',
        handle: '.titlebar',
        stop: async () => {
          if (props.options.exec_path) {
            await set(props.options.exec_path, node_ref.getBoundingClientRect());
          }
        }
      });
    }
    if (props.options.resizable) {
      window.jQuery(node_ref).resizable({
        minWidth: props.options.min_width,
        minHeight: props.options.min_height,
        aspectRatio: props.options.aspect_ratio,
        containment: 'parent',
        handles: 'all',
        classes: {
          'ui-resizable-se': 'ui-icon ui-icon-gripsmall-diagonal-se opacity-0'
        },
        start: () => {
          const iframe = node_ref.querySelector('iframe');
          if (iframe) {
            iframe.style.pointerEvents = 'none';
          }
        },
        stop: async () => {
          if (props.options.exec_path) {
            await set(props.options.exec_path, node_ref.getBoundingClientRect());
          }
          const iframe = node_ref.querySelector('iframe');
          if (iframe) {
            iframe.style.removeProperty('pointer-events');
          }
        }
      });
    }
  }

  function update_icon(icon) {
    titlebar?.update_icon(icon);
  }

  function update_title(title) {
    setRunningPrograms((values) => {
      const program = values.find((el) => el.options.id == props.options.id);
      const index = values.indexOf(program);
      if (index >= 0) {
        values[index].options.title = title;
      }
      return values;
    });
    titlebar?.update_title(title);
  }

  function show_toast({ theme = 'dark', message }) {
    const toast = document.createElement('div');
    toast.style.position = 'absolute';
    toast.style.transform = 'translate(-50%)';
    toast.style.left = '50%';
    toast.style.top = '50%';
    toast.style.padding = '10px';
    toast.innerText = message;
    toast.style.borderRadius = '7px';
    toast.style.opacity = 1;
    toast.style.fontSize = '12px';
    toast.style.minHeight = '30px';
    toast.style.minWidth = '70px';
    toast.style.zIndex = 99999;
    if (theme == 'dark') {
      toast.style.backgroundColor = '#0f172a';
      toast.style.border = '1px solid #f1f5f9';
      toast.style.color = '#f8fafc';
    } else {
      toast.style.backgroundColor = '#f1f5f9';
      toast.style.border = '1px solid #1e293b';
      toast.style.color = '#0f172a';
    }
    node_ref.append(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  return (
    <div
      ref={(el) => (node_ref = el)}
      use:clickOutside={loose_focus}
      onMouseDown={focus}
      style={{
        opacity: 0,
        position: 'absolute',
        'border-top-left-radius': '8px',
        'border-top-right-radius': '8px',
        padding: '0px',
        '-webkit-font-smoothing': 'antialiased',
        width: `${props.options.width}px`,
        height: `${props.options.height}px`,
        'min-width': `${props.options.min_width}px`,
        'min-height': `${props.options.min_height}px`,
        transform: minimized() ? `${translateX()} ${translateY()} scale(0.1)` : 'none',
        background: props.options.background,
        'z-index': localZ(),
        'box-shadow': localZ() < zIndex() ? 'var(--window-box-shadow-inactive)' : 'var(--window-box-shadow)'
      }}
      class={`window absolute flex flex-col bg-xp-yellow ${animation_enabled() ? 'transition duration-300' : ''} ${minimized() ? 'opacity-0' : ''}`}
      program-id={props.options.id}
    >
      <div class="shrink-0">
        <TitleBar
          ref={(api) => (titlebar = api)}
          options={props.options}
          inactive={localZ() < zIndex()}
          maximized={maximized()}
          on_click_close={on_click_close}
          on_click_maximize={on_click_maximize}
          on_click_minimize={on_click_minimize}
        />
      </div>
      <div class="grow shrink-0 relative shadow-xl">{props.children}</div>
    </div>
  );
}
