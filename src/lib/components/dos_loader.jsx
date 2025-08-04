import { JSX } from "solid-js";

function DosLoader(props) {
  return (
    <div class={`absolute top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black overflow-hidden ${props.show ? '' : 'hidden'} font-MSSS`}>
      <div class="mt-12 ml-8 text-lg">
        <div class="w-6 h-1 animate-cursor bg-slate-50"></div>
      </div>
    </div>
  );
}

export default DosLoader;
