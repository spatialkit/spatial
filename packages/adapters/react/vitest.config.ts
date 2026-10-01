import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@spatial-kit/core': resolve(__dirname, '../../core/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/__tests__/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    reporters: ['default'],
    passWithNoTests: false,
  },
});
