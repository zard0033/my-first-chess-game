import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // pgn-viewer doesn't export CSS in its package.json exports map; bypass via absolute path
      {
        find: '@lichess-org/pgn-viewer/dist/lichess-pgn-viewer.css',
        replacement: fileURLToPath(
          new URL('./node_modules/@lichess-org/pgn-viewer/dist/lichess-pgn-viewer.css', import.meta.url),
        ),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['stockfish'],
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chess-board': ['vue3-chessboard', 'chessground', 'chess.js'],
          'chess-openings': ['chess-openings'],
        },
      },
    },
  },
})
