import solid from "solid-start/vite";
import node from "solid-start-node";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ adapter: node() })],
  server: {
    host: true,
    port: 3000
  },
  optimizeDeps: {
    include: ["jquery", "jquery-ui"]
  }
});
