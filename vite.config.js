import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Phaser and the launch-critical game modules intentionally ship as one startup bundle.
    // Keep the warning ceiling just above the measured bundle; this is not an unlimited bypass.
    chunkSizeWarningLimit: 1600,
    reportCompressedSize: true
  }
});
