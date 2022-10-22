import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { Table } from "flowbite-react";
import Header from "~/components/Header";
import { getRentables } from "~/models/inventory.server.";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return { rentables };
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8">
        <h1 className="text-6xl font-bold">Estoque</h1>
        <div className="w-max">
        <Table>
          <Table.Head>
            <Table.HeadCell>Id</Table.HeadCell>
            <Table.HeadCell>Nome</Table.HeadCell>
            <Table.HeadCell>Quantidade</Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">Edit</span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {rentables.map((rentable) => (
              <Table.Row key={rentable.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {rentable.id}
                </Table.Cell>
                <Table.Cell> {rentable.name}</Table.Cell>
                <Table.Cell> {rentable.count}</Table.Cell>
                <Table.Cell>
                  <button>Editar Quantidade</button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        </div>
      </main>
    </>
  );
}
