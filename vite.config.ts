import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const version = readFileSync('VERSION', 'utf-8').trim()

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/resumebuilder/' : '/',
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
