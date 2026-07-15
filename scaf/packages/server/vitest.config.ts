import { defineConfig } from 'vitest/config';

// DB test terpisah agar data dev tidak terhapus. Bisa dioverride via TEST_DATABASE_URL.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://haulops:haulops_dev@localhost:5433/haulops_test';

// globalSetup berjalan di proses utama vitest (bukan worker) dan meng-instantiate
// PrismaClient, jadi DATABASE_URL harus sudah menunjuk DB test sebelum itu.
process.env.DATABASE_URL = TEST_DATABASE_URL;

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Test berbagi satu DB test; jalankan sekuensial agar mutasi antar-file tidak bentrok.
    fileParallelism: false,
    globalSetup: ['./src/test/global-setup.ts'],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
});
