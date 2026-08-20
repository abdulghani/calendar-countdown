import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: no server render, one HTML shell that hydrates any route.
  ssr: false,
} satisfies Config;
