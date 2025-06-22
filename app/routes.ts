import { type RouteConfig } from "@react-router/dev/routes";

import { remixRoutesOptionAdapter } from "@react-router/remix-routes-option-adapter";

export default remixRoutesOptionAdapter((defineRoutes) => {
  return defineRoutes((route) => {
    route("/", "routes/index.tsx", { index: true });
    route("/api/building-sites", "routes/api/building-sites/index.ts");
    route("login", "routes/login.tsx");
    route("join", "routes/join.tsx");
    route("logout", "routes/logout.tsx");
    route("healthcheck", "routes/healthcheck.tsx");
    route("budgets/new", "routes/budgets/new.tsx");
    route("budgets/:budgetId", "routes/budgets/$budgetId.tsx");
    route("budgets/:budgetId/print", "routes/budgets/$budgetId.print.tsx");
    route("print-pdf", "routes/print-pdf.tsx");
    route("rentablesInventory", "routes/rentablesInventory.tsx");
    route("clients", "routes/clients/index.tsx");
    route("clients/:clientId", "routes/clients/$clientId.tsx");
    route("deliveries", "routes/deliveries/index.tsx");
    route("deliveries/:deliveryId", "routes/deliveries/$deliveryId.tsx");
    route("admin/users", "routes/admin/users.tsx");
    route("admin/inventory", "routes/admin/inventory.tsx");
    route("building-sites", "routes/building-sites/index.tsx");
    route(
      "building-sites/:buildingId",
      "routes/building-sites/$buildingId.tsx",
    );
  });
}) satisfies RouteConfig;
