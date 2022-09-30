import type { ActionArgs, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button, Label, Modal, Table, TextInput } from "flowbite-react";
import { useState } from "react";

import AppNavbar from "~/components/Navbar";
import { createClient, getClients } from "~/models/clients.server";
import { requireUserId } from "~/session.server";

export const loader: LoaderFunction = async () => {
  return json({ clients: await getClients() });
};

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
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

export default function Posts() {
  const { clients } = useLoaderData<typeof loader>();

  const [show, setShow] = useState(false);

  return (
    <>
      <AppNavbar />
      <main className="flex h-full flex-col gap-4 p-4">
        <h1 className="text-6xl font-bold">Clientes</h1>

        <Button onClick={() => setShow(true)}>Criar Cliente</Button>
        <Modal show={show} onClose={() => setShow(false)}>
          <Modal.Header>Novo Cliente</Modal.Header>
          <Modal.Body>
            <Form
              method="post"
              id="client-form"
              className="flex flex-col gap-4"
            >
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="name" value="Nome" />
                </div>
                <TextInput id="name" name="name" required />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="address" value="Endereço" />
                </div>
                <TextInput id="address" name="address" />
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" form="client-form">
              Criar
            </Button>
            <Button color="gray">Cancelar</Button>
          </Modal.Footer>
        </Modal>
        <Table striped={true}>
          <Table.Head>
            <Table.HeadCell>id</Table.HeadCell>
            <Table.HeadCell>Nome</Table.HeadCell>
            <Table.HeadCell>Endereço</Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">Edit</span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {clients.map((c) => (
              <Table.Row
                key={c.id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {c.id}
                </Table.Cell>
                <Table.Cell>{c.name}</Table.Cell>
                <Table.Cell>{c.address}</Table.Cell>
                <Table.Cell>
                  <a
                    href="/tables"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  >
                    Edit
                  </a>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </main>
    </>
  );
}
