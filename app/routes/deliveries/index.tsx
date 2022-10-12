import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import { Card } from "flowbite-react";
import { HiOutlineArrowDown, HiOutlineArrowUp } from "react-icons/hi";
import Header from "~/components/Header";
import { getDeliveries } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json({ deliveries: await getDeliveries() });
}

export default function Deliveries() {
  const { deliveries } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8">
        <h1 className="text-6xl font-bold">Remessas</h1>
        <>
          {deliveries.map((d) => (
            <Card key={d.id}>
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {dayjs(d.createdAt).format("DD/MM/YYYY HH:mm")}
              </h5>
              <p className="font-normal text-gray-700 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  Andaimes: {d.scaffoldingCount}{" "}
                  {d.scaffoldingDeliveryType === 1 ? (
                    <HiOutlineArrowUp color="green" />
                  ) : (
                    <HiOutlineArrowDown color="red" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  Escoras: {d.propsCount}{" "}
                  {d.propsDeliveryType === 1 ? (
                    <HiOutlineArrowUp color="green" />
                  ) : (
                    <HiOutlineArrowDown color="red" />
                  )}
                </div>
              </p>
              <Link className="font-medium text-blue-600 dark:text-blue-500 hover:underline" to={`/building-sites/${d.buildingSiteId}`}>Ver Obra</Link>
            </Card>
          ))}
        </>
      </main>
    </>
  );
}
