import { onMount } from "solid-js";

export default function FlashPlayer(props) {
  const src = props?.fs_item?.url ?? "";

  onMount(() => {
    // Load Ruffle script once
    if (!window.RufflePlayer) {
      window.RufflePlayer = window.RufflePlayer || {};
      window.RufflePlayer.config = { autoplay: "auto" };

      const script = document.createElement("script");
      script.src = "https://unpkg.com/@ruffle-rs/ruffle";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return (
    <div class="w-full h-full">
      <ruffle-player src={src} class="w-full h-full" />
    </div>
  );
}
