import { onMount } from "solid-js";
import TitleBar from "./TitleBar.jsx";
import * as utils from "../../utils";

export default function Window(props) {
  let nodeRef;
  let saved_position;
  let maximized = false;

  const set_position = ({ top, left, width, height, absolute_values }) => {
    if (absolute_values) {
      const parent_top = nodeRef.parentNode.getBoundingClientRect().top;
      const parent_left = nodeRef.parentNode.getBoundingClientRect().left;
      top = top - parent_top;
      left = left - parent_left;
    }
    nodeRef.style.top = `${top}px`;
    nodeRef.style.left = `${left}px`;
    nodeRef.style.width = `${width}px`;
    nodeRef.style.height = `${height}px`;
  };

  const enable_drag = () => {
    window.jQuery(nodeRef).draggable({ containment: "parent", handle: ".titlebar" });
    window.jQuery(nodeRef).resizable({
      minWidth: props.options.min_width,
      minHeight: props.options.min_height,
      containment: "parent",
      handles: "all",
      classes: { "ui-resizable-se": "" }
    });
  };

  const on_click_close = () => {
    props.on_click_close && props.on_click_close();
  };

  const on_click_maximize = () => {
    if (maximized) {
      set_position(saved_position);
      maximized = false;
    } else {
      const rect = utils.relative_rect(
        nodeRef.parentNode.getBoundingClientRect(),
        nodeRef.getBoundingClientRect()
      );
      saved_position = {
        top: rect.top,
        left: rect.left,
        width: nodeRef.offsetWidth,
        height: nodeRef.offsetHeight
      };
      set_position({
        top: 0,
        left: 0,
        width: nodeRef.parentNode.offsetWidth,
        height: nodeRef.parentNode.offsetHeight
      });
      maximized = true;
    }
    props.on_click_maximize && props.on_click_maximize(maximized);
  };

  onMount(() => {
    if (props.options.top == null) {
      props.options.top =
        (nodeRef.parentNode.offsetHeight - nodeRef.offsetHeight) / 2;
    }
    if (props.options.left == null) {
      props.options.left =
        (nodeRef.parentNode.offsetWidth - nodeRef.offsetWidth) / 2;
    }
    set_position({
      top: props.options.top,
      left: props.options.left,
      width: nodeRef.width,
      height: nodeRef.height
    });
    enable_drag();
  });

  return (
    <div
      ref={(el) => (nodeRef = el)}
      style={{
        position: "absolute",
        background: "silver",
        "box-shadow":
          "inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px grey, inset 2px 2px #fff",
        padding: "3px"
      }}
      class="absolute flex flex-col"
      style={{
        "min-width": `${props.options.min_width}px`,
        "min-height": `${props.options.min_height}px`
      }}
    >
      <div class="shrink-0">
        <TitleBar
          options={props.options}
          on_click_close={on_click_close}
          on_click_maximize={on_click_maximize}
        />
      </div>
      <div class="grow shrink-0 relative">{props.children}</div>
    </div>
  );
}
