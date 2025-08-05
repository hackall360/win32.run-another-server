import { onMount, onCleanup } from "solid-js";

export default function ScreenSaver() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const src = params.get("src");

  onMount(() => {
    const exit = () => window.close();
    window.addEventListener("mousemove", exit);
    window.addEventListener("keydown", exit);
    window.addEventListener("mousedown", exit);
    onCleanup(() => {
      window.removeEventListener("mousemove", exit);
      window.removeEventListener("keydown", exit);
      window.removeEventListener("mousedown", exit);
    });
  });

  return (
    <div class="w-screen h-screen overflow-hidden">
      {src && <iframe src={src} class="w-full h-full border-0" title="screensaver" />}
    </div>
  );
}
