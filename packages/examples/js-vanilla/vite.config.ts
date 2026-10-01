import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/vanilla/' : '/',
  resolve: {
    alias: {
      '@spatial-kit/core': resolve(__dirname, '../../core/src/index.ts'),
      '@spatial-kit/svg': resolve(__dirname, '../../svg/src/index.ts'),
    },
  },
}));
