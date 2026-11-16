import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  // GitHub Pages project sites are served beneath /<repository>/.
  // Keep the normal root base for Lovable/local previews.
  base: isGitHubPages ? "/yukesh-works/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});