import { mount, StartClient } from "solid-start/entry-client";
import { connectionType, connectionSpeeds, systemVolume } from "./lib/store";

const originalFetch = window.fetch.bind(window);
const dialupAudio = new Audio("/sounds/dialup.mp3");

window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const type = connectionType();
  const speed = connectionSpeeds[type];
  if (type === "dialup") {
    dialupAudio.volume = systemVolume();
    try {
      dialupAudio.currentTime = 0;
      dialupAudio.play();
    } catch (_) {}
  }
  if (speed && speed !== Infinity) {
    const length = parseInt(response.headers.get("content-length") || "0", 10);
    if (length > 0) {
      const delay = (length / speed) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  if (type === "dialup") {
    dialupAudio.pause();
  }
  return response;
};

mount(() => <StartClient />, document.getElementById("root"));
