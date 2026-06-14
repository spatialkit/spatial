import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/vanilla/' : '/',
  resolve: {
    alias: {
      '@floormap-tools/core': resolve(__dirname, '../../core/src/index.ts'),
      '@floormap-tools/svg': resolve(__dirname, '../../svg/src/index.ts'),
    },
  },
}));
