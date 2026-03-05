/// <reference types="vitest/config" />
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    modules: {
      scopeBehaviour: "local" // default
    }
  },
  test: {
    projects: [{
      extends: true,
    }]
  }
});