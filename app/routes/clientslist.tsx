import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getClients } from "~/models/client.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const search = new URL(request.url).searchParams.get("search") ?? undefined;

  const { data } = await getClients({ search });

  return json(data);
}
