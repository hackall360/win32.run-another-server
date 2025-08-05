import { createSignal } from "solid-js";

export default function CheckBox(props) {
  const [checked, setChecked] = createSignal(props.checked ?? false);
  const size = () => props.size ?? 12;

  const toggle = () => {
    const newVal = !checked();
    setChecked(newVal);
    props.onChange && props.onChange(newVal);
  };

  return (
    <div class="flex flex-row items-start" onClick={toggle} style={props.style}>
      <div
        class="border border-slate-500 bg-slate-50 inline-block box-content"
        style={{ width: `${size()}px`, height: `${size()}px` }}
      >
        {checked() &&
          (props.checkmark !== false ? (
            <img
              alt=""
              src="/images/xp/checkmark.png"
              style={{
                width: `${size() - 2}px`,
                height: `${size() - 2}px`,
                margin: "1px"
              }}
            />
          ) : (
            <div
              class="bg-gradient-to-r from-green-600 to-green-500 block"
              style={{
                width: `${size() - 4}px`,
                height: `${size() - 4}px`,
                margin: "2px"
              }}
            />
          ))}
      </div>
      <span class="text-[11px] ml-1">{props.label}</span>
    </div>
  );
}
