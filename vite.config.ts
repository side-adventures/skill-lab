import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' + HashRouter => works on GitHub Pages under any repo name.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
