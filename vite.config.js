import { resolve } from "path";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy'

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),

  build: {
      outDir: resolve(__dirname, 'dist'),
      rollupOptions: {
          input: {
            popup: resolve(__dirname,"src/popup/index.html")
          }
      }
  },
  plugins: [
      vue(),
      copy({
        targets: [
          { src: 'src/manifest.json', dest: resolve(__dirname, 'dist/') },
          { src: 'src/assets/icon/**/*', dest: resolve(__dirname, 'dist/assets/icon') }
        ]
      })
  ],
})