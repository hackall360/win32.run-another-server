import TitleBar from "./TitleBar.jsx";
import Button from "./Button.jsx";

export default function Dialog(props) {
  const destroy = () => {
    props.destroy ? props.destroy() : props.on_close && props.on_close();
  };

  const handleBackgroundClick = (e) => {
    const div = e.currentTarget.querySelector("div");
    div.classList.add("animate-blink");
    setTimeout(() => div.classList.remove("animate-blink"), 400);
  };

  return (
    <div
      class="z-20 dialog absolute inset-0 bg-slate-50/10 rounded-t-lg"
      onClick={handleBackgroundClick}
    >
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col"
        style={{ width: "400px", height: "150px" }}
      >
        <TitleBar
          options={{ title: props.title, maximize_btn: false, minimize_btn: false }}
          on_click_close={destroy}
        />
        <div class="grow p-2 bg-xp-yellow overflow-hidden flex flex-col justify-between border-t-0 border-2 border-blue-600">
          <div class="grow flex flex-row text-[11px] p-2 text-slate-800">
            {props.icon && (
              <div
                class="w-8 h-8 mr-4 shrink-0 bg-contain"
                style={{ "background-image": `url(${props.icon})` }}
              />
            )}
            <div>{props.message}</div>
          </div>
          <div
            class={`flex flex-row pb-1 items-center ${
              props.button_align === "center" ? "justify-center" : "justify-end"
            }`}
          >
            {props.buttons?.map((button) => (
              <Button
                title={button.name}
                on_click={button.action}
                focus={button.focus}
                style="margin-left:7px;margin-right:7px;"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
