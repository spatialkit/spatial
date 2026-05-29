import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@floormap/core': resolve(__dirname, '../core/src/index.ts'),
      '@floormap/svg': resolve(__dirname, '../svg/src/index.ts'),
    },
  },
});
