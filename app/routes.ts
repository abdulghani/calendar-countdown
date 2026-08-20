import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layout.tsx", [
    index("routes/countdown.tsx"),
    route("events", "routes/events.tsx"),
  ]),
] satisfies RouteConfig;
