import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.test.{ts,tsx}"],
  browserNodeBuiltinsPolyfill: { modules: { crypto: true } },
  routes(defineRoutes) {
    // uses the v1 convention, works in v1.15+ and v2
    return createRoutesFromFolders(defineRoutes);
  },
};
