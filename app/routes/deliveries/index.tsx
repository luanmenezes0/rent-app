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
                {d.buildingSite.name} -{" "}
                {dayjs(d.createdAt).format("DD/MM/YYYY HH:mm")}
              </h5>
              {d.units.map((u) => (
                <p
                  key={u.id}
                  className="font-normal text-gray-700 dark:text-gray-400"
                >
                  <div className="flex items-center gap-2">
                    {u.rentable.name} - {u.count}
                    {u.deliveryType === 1 ? (
                      <HiOutlineArrowUp color="green" />
                    ) : (
                      <HiOutlineArrowDown color="red" />
                    )}
                  </div>
                </p>
              ))}

              <Link
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                to={`/building-sites/${d.buildingSiteId}`}
              >
                Ver Obra
              </Link>
            </Card>
          ))}
        </>
      </main>
    </>
  );
}
