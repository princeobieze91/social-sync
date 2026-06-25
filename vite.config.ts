import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

const plugins = [inspectAttr(), react()]

if (process.env.NODE_ENV !== "production") {
  try {
    const { default: devServer } = await import("@hono/vite-dev-server")
    plugins.unshift(devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }))
  } catch {}
}

// https://vite.dev/config/
export default defineConfig({
  plugins,
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
