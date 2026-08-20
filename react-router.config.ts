import type { Config } from "@react-router/dev/config";

/**
 * Set BASE_PATH when the site is served from a subpath, e.g. a GitHub Pages
 * project site at /calendar-countdown/. Empty locally, so dev stays at "/".
 */
const basePath = process.env.BASE_PATH ?? "";

export default {
  // SPA mode: no server render, one HTML shell that hydrates any route.
  ssr: false,
  basename: `${basePath.replace(/\/$/, "")}/`,
} satisfies Config;
