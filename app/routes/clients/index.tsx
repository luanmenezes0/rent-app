import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useTransition } from "@remix-run/react";
import { Button, Table } from "flowbite-react";
import { useEffect, useState } from "react";
import { ClientModal } from "~/components/ClientModal";

import Header from "~/components/Header";
import { createClient, deleteClient, getClients } from "~/models/client.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json({ clients: await getClients() });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create": {
      const name = formData.get("name");
      const address = formData.get("address");

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

      await createClient({ address, name });

      return null;
    }

    case "delete": {
      const id = formData.get("id") as string;

      await deleteClient(id);
      return null;
    }

    default:
      throw new Error("unknown action");
  }
}

export default function Clients() {
  const { clients } = useLoaderData<typeof loader>();

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
      <main className="flex h-full flex-col gap-4 p-8">
        <h1 className="text-6xl font-bold">Clientes</h1>
        <Button onClick={() => setShow(true)}>Criar Cliente</Button>

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
            {clients.map((c) => (
              <Table.Row
                key={c.id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  <Link to={`/clients/${c.id}`}>{c.id}</Link>
                </Table.Cell>
                <Table.Cell>{c.name}</Table.Cell>
                <Table.Cell>{c.address}</Table.Cell>
                <Table.Cell>
                  <Form
                    method="delete"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <button name="_action" value="delete">
                      Deletar
                    </button>
                  </Form>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </main>
      {show && <ClientModal onClose={() => setShow(false)} />}
    </>
  );
}
