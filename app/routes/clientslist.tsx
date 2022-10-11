import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getClients } from "~/models/client.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json(await getClients());
}
