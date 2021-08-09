import { resolve } from "path";
import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import glob from 'fast-glob'
import packageJson from "./package.json";
import manifestJson from "./src/manifest.json";
import fs from 'fs-extra'
 

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),
  
  build: {
      emptyOutDir: true,
      outDir: resolve(__dirname, 'dist'),
      rollupOptions: {
          input: {
            popup: resolve(__dirname,"src/popup/index.html")
          }
      }
  },
  plugins: [
      vue(),
      {
        name: 'output_manifest',
        generateBundle(outputOptions, bundle) {
          manifestJson.version = packageJson.version;
          this.emitFile({
              type: 'asset',
              fileName: 'manifest.json',
              source: JSON.stringify(manifestJson, null, 4) 
          });
        }
      },
      {
        name: 'output_icon_files',
        async generateBundle() {
          const src =  'src/assets/icon/';
          const dest = 'assets/icon/';
          const files = await glob('**/*', { cwd: 'src/assets/icon/' })
    
          await Promise.all(files.map(file => (async () => this.emitFile({
            type: 'asset',
            fileName: path.join(dest, file),
            source: await fs.readFile(path.join(src, file))
          }))()))
        }
      }
      
  ],
})