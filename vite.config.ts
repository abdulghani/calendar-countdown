import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const basePath = process.env.BASE_PATH ?? "";

export default defineConfig({
  // Asset URLs must carry the subpath too when deployed under one.
  base: `${basePath.replace(/\/$/, "")}/`,
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
