import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getClients } from "~/models/client.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const search = new URL(request.url).searchParams.get("search") ?? undefined;

  const { data } = await getClients({ search });

  return json(data);
}
