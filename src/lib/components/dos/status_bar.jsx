import { createSignal, Show } from "solid-js";

let setLMessage;
let setRMessage;

export async function display(messages) {
  for (const { l = "", r = "", d = 1000 } of messages) {
    setLMessage && setLMessage(l);
    setRMessage && setRMessage(r);
    await new Promise((resolve) => setTimeout(resolve, d));
  }
}

function StatusBar(props) {
  const [lMessage, _setLMessage] = createSignal(props.l_message || "");
  const [rMessage, _setRMessage] = createSignal(props.r_message || "");
  setLMessage = _setLMessage;
  setRMessage = _setRMessage;

  return (
    <div class="absolute bottom-0 left-0 right-0 h-8 bg-slate-200 text-slate-900 flex flex-row overflow-hidden font-MSSS">
      <div class="grow h-full pb-1 font-bold px-4">{lMessage()}</div>
      <Show when={props.show_separator}>
        <div class="w-1 h-full bg-slate-900"></div>
      </Show>
      <div class="basis-1/4 shrink-0 pb-1 font-bold px-4">{rMessage()}</div>
    </div>
  );
}

export default StatusBar;
