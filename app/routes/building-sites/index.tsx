import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Table } from "flowbite-react";

import Header from "~/components/Header";
import { getBuildingSites } from "~/models/buildingSite.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json({ buildingSites: await getBuildingSites() });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  return null;
}

export default function BuildingSites() {
  const { buildingSites } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-6 p-8">
        <h1 className="text-6xl font-bold">Obras</h1>

        <Table striped>
          <Table.Head>
            <Table.HeadCell>Id</Table.HeadCell>
            <Table.HeadCell>Nome</Table.HeadCell>
            <Table.HeadCell>Endereço</Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">Ações</span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {buildingSites.map((bs) => (
              <Table.Row
                key={bs.id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {bs.id}
                </Table.Cell>
                <Table.Cell>{bs.name}</Table.Cell>
                <Table.Cell>{bs.address}</Table.Cell>
                <Table.Cell>
                  <Link
                    className="px-2 font-medium text-blue-600 hover:underline dark:text-blue-500"
                    to={`/building-sites/${bs.id}`}
                  >
                    Ver detalhes
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </main>
    </>
  );
}
