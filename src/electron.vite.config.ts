import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import copy from 'rollup-plugin-copy';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      copy({
        targets: [
          { src: 'resources/initial-ngram-model.json', dest: 'dist/resources' },
        ],
        hook: 'writeBundle',
      }),
    ]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
