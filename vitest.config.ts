import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@spatial-kit/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@spatial-kit/svg': resolve(__dirname, 'packages/svg/src/index.ts'),
      '@spatial-kit/react': resolve(__dirname, 'packages/adapters/react/src/index.ts'),
    },
  },
  test: {
    include: ['packages/**/src/__tests__/*.test.{ts,tsx}'],
    setupFiles: ['packages/adapters/react/src/__tests__/setup.ts'],
    reporters: ['default'],
    passWithNoTests: false,
  },
});
