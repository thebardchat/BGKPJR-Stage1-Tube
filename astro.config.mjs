import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

export default defineConfig({
  site: "https://thebardchat.github.io",
  base: "/BGKPJR-Stage1-Tube",
  integrations: [svelte()],
  output: "static",
  server: { port: 4325 },
  vite: {
    ssr: { noExternal: ["three"] },
  },
});
