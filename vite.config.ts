import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Если деплоишь на GitHub Pages в репо `flat-planner` — раскомментируй base.
// Для production-домена или Pages с CNAME оставь '/'.
const repoName = 'flat-planner'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? `/${repoName}/` : '/',
  plugins: [react()],
  server: {
    port: 5180,
  },
}))
