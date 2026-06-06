import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@floormap/core': resolve(__dirname, '../../core/src/index.ts'),
      '@floormap/react': resolve(__dirname, '../../adapters/react/src/index.ts'),
    },
  },
});
