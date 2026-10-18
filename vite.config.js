import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The "@" alias points to /src, e.g. import { Maze } from '@/engine/maze'
export default defineConfig({
  plugins: [react()],
    // GitHub Pages serves this repository from /CMR/, not from the domain root.
    // Keep local development at / while emitting the correct paths in CI builds.
    base: process.env.GITHUB_ACTIONS ? '/CMR/' : '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
