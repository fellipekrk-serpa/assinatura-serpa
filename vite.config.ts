/* Vite config for building the frontend react app: https://vite.dev/config/ */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, readdirSync, existsSync, createReadStream } from 'node:fs'
import type { Plugin } from 'vite'
// @ts-expect-error - uidPlugin is a custom plugin
import uidPlugin from './vite-plugin-react-uid'

// Personal originals stay outside public/ and are never included in a build.
function localWorkbooks(): Plugin {
  const directory = path.resolve(__dirname, 'Apostilas')
  return {
    name: 'personal-workbooks',
    configureServer(server) {
      server.middlewares.use('/apostilas/', (request, response, next) => {
        const name = request.url?.split('?')[0].slice(1)
        const files = existsSync(directory)
          ? readdirSync(directory).filter((file) => /^[a-z0-9-]+\.pdf$/.test(file))
          : []
        if (name === 'index.json') {
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(files.map((file) => file.slice(0, -4))))
          return
        }
        if (!name || !files.includes(name)) return next()
        response.setHeader('Content-Type', 'application/pdf')
        createReadStream(path.join(directory, name)).on('error', () => {
          response.destroy()
        }).pipe(response)
      })
    },
  }
}

// Serve PDF.js fallback fonts locally in both development and production.
function pdfFonts(): Plugin {
  const directory = path.resolve(__dirname, 'node_modules/pdfjs-dist/standard_fonts')
  const files = readdirSync(directory)
  return {
    name: 'local-pdf-fonts',
    generateBundle() {
      for (const name of files)
        this.emitFile({ type: 'asset', fileName: `pdfjs/standard_fonts/${name}`, source: readFileSync(path.join(directory, name)) })
    },
    configureServer(server) {
      server.middlewares.use('/pdfjs/standard_fonts/', (request, response, next) => {
        const name = request.url?.split('?')[0].slice(1)
        if (!name || !files.includes(name)) return next()
        response.setHeader('Content-Type', 'application/octet-stream')
        response.end(readFileSync(path.join(directory, name)))
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  build: {
    outDir: mode === 'development' ? 'dev-dist' : 'dist',
    minify: mode !== 'development',
    // lightningcss in every mode so dev/QA catches the same CSS errors as prod
    cssMinify: 'lightningcss',
    sourcemap: mode === 'development',
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
  },
  plugins: [mode === 'development' ? uidPlugin() : undefined, react(), pdfFonts(), localWorkbooks()].filter(Boolean),
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode ?? process.env.NODE_ENV ?? 'production'),
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /zod\/v4\/core/,
        replacement: path.resolve(__dirname, 'node_modules', 'zod', 'v4', 'core'),
      }
    ],
  },
}))
