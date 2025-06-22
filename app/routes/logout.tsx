import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";

import { logout } from "~/session.server";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export async function loader() {
  return redirect("/login");
}
