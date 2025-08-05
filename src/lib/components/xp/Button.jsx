import { onMount } from "solid-js";
import "./Button.css";

export default function Button(props) {
  let ref;

  onMount(() => {
    if (props.focus && ref) {
      ref.focus();
    }
  });

  const handleClick = (e) => {
    if (props.on_click) props.on_click(e);
  };

  return (
    <button
      ref={ref}
      disabled={props.disabled}
      style={props.style}
      class="button disabled:opacity-30"
      onClick={handleClick}
    >
      {props.title}
      {props.children}
    </button>
  );
}
