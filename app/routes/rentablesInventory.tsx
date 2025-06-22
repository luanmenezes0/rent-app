import type { LoaderFunctionArgs } from "react-router";

import { getInventory } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  const { _sum } = await getInventory(Number(id));

  return { inventory: _sum.count };
}
