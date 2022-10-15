import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useTransition } from "@remix-run/react";
import { Button, Table } from "flowbite-react";
import { useEffect, useState } from "react";
import { BuildingSiteModal } from "~/components/BuildingSiteModal";

import Header from "~/components/Header";
import {
  createBuildingSite,
  deleteBuildingSite,
  getBuildingSites,
} from "~/models/buildingSite.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json({ buildingSites: await getBuildingSites() });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create": {
      const name = formData.get("name");
      const address = formData.get("address");
      const clientId = formData.get("clientId");

      if (typeof name !== "string" || name.length === 0) {
        return json(
          { errors: { title: "name is required", body: null } },
          { status: 400 }
        );
      }

      if (typeof address !== "string" || address.length === 0) {
        return json(
          { errors: { title: null, body: "address is required" } },
          { status: 400 }
        );
      }

      if (!clientId) {
        return json(
          { errors: { title: null, body: "clientId is required" } },
          { status: 400 }
        );
      }

      await createBuildingSite({ address, name, clientId: Number(clientId) });

      return null;
    }

    case "delete": {
      const id = formData.get("id") as string;

      await deleteBuildingSite(id);
      return null;
    }

    default:
      throw new Error("unknown action");
  }
}

export default function BuildingSites() {
  const { buildingSites } = useLoaderData<typeof loader>();

  const transition = useTransition();

  const [show, setShow] = useState(false);

  const isAdding = transition.state === "submitting";

  useEffect(() => {
    if (!isAdding) {
      setShow(false);
    }
  }, [isAdding]);

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-6 p-8">
        <h1 className="text-6xl font-bold">Obras</h1>
        <Button onClick={() => setShow(true)}>Criar Obra</Button>

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
      {show && <BuildingSiteModal onClose={() => setShow(false)} />}
    </>
  );
}
