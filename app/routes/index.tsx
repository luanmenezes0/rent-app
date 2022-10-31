import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import Header from "~/components/Header";
import type { Rentable } from "~/models/inventory.server.";
import { getRentables } from "~/models/inventory.server.";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return json({ rentables });
}

function Card({
  rentable,
}: {
  rentable: Omit<Rentable, "createdAt" | "updatedAt">;
}) {
  const fetcher = useFetcher<{ inventory: number | null }>();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load(`/rentablesinventory/?id=${rentable.id}`);
    }
  }, [fetcher, rentable.id]);

  return (
    <article className="flex flex-col gap-4 bg-red-500">
      <div>NOME: {rentable.name}</div>
      <div>TOTAL: {rentable.count}</div>
      <div>ALUGADO: {fetcher.data?.inventory}</div>
    </article>
  );
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8">
        {rentables.map((item) => (
          <Card key={item.id} rentable={item} />
        ))}
      </main>
    </>
  );
}
