import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/react/' : '/',
  resolve: {
    alias: {
      '@spatial-kit/core': resolve(__dirname, '../../core/src/index.ts'),
      '@spatial-kit/react': resolve(__dirname, '../../adapters/react/src/index.ts'),
    },
  },
}));
