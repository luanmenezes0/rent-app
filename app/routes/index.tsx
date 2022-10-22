import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Header from "~/components/Header";
import { getInventory } from "~/models/delivery.server";
import { getRentables } from "~/models/inventory.server.";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const { _sum } = await getInventory(1);

  const rentables = await getRentables();

  return json({ inventory: _sum.count, rentables });
}

export default function Index() {
  const { inventory, rentables } = useLoaderData<typeof loader>();
  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8">
        {rentables.map((item) => (
          <p key={item.id}>
            <div>{item.name}</div>
            <div>ALUGADO: {inventory}</div>
            <div>TOTAL: {item.count}</div>
          </p>
        ))}
      </main>
    </>
  );
}
