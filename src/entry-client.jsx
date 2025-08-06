import { mount, StartClient } from "solid-start/entry-client";
import { connectionType, connectionSpeeds, systemVolume } from "./lib/store";

// Preserve the original fetch function
const originalFetch = window.fetch.bind(window);

// Audio context for simulating dial-up sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let nextAudioTime = audioCtx.currentTime;

function playDialup(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length === 0) return;

  if (audioCtx.state === "suspended") {
    // Resume audio context in case it was suspended by the browser
    audioCtx.resume();
  }

  const start = Math.max(nextAudioTime, audioCtx.currentTime);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  gain.gain.setValueAtTime(systemVolume(), start);
  osc.connect(gain).connect(audioCtx.destination);

  const byteDuration = 1 / connectionSpeeds["dialup"]; // seconds per byte
  let t = start;
  for (let i = 0; i < bytes.length; i++) {
    const freq = 600 + (bytes[i] / 255) * 2000; // map byte to frequency
    osc.frequency.setValueAtTime(freq, t);
    t += byteDuration;
  }

  osc.start(start);
  osc.stop(t);
  nextAudioTime = t;
}

window.fetch = async (...args) => {
  const [resource, init] = args;
  const type = connectionType();
  const speed = connectionSpeeds[type];

  // Handle outgoing data
  if (type === "dialup" && init && init.body) {
    try {
      let outBytes;
      if (typeof init.body === "string") {
        outBytes = new TextEncoder().encode(init.body);
      } else if (init.body instanceof ArrayBuffer) {
        outBytes = new Uint8Array(init.body);
      } else if (init.body instanceof Blob) {
        outBytes = new Uint8Array(await init.body.arrayBuffer());
      }
      if (outBytes) {
        playDialup(outBytes);
        if (speed && speed !== Infinity) {
          const delay = (outBytes.byteLength / speed) * 1000;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    } catch (_) {}
  }

  const response = await originalFetch(resource, init);

  if (type === "dialup") {
    try {
      const buffer = await response.clone().arrayBuffer();
      playDialup(buffer);
      if (speed && speed !== Infinity) {
        const delay = (buffer.byteLength / speed) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (_) {}
  } else if (speed && speed !== Infinity) {
    const length = parseInt(response.headers.get("content-length") || "0", 10);
    if (length > 0) {
      const delay = (length / speed) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return response;
};

mount(() => <StartClient />, document.getElementById("root"));

