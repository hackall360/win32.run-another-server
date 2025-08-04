import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    // basicSsl()
  ],
  server: {
    host: true,
    // https: true,
    port: 3000
  },
  optimizeDeps: {
    include: ['jquery', 'jquery-ui']
  }
});
