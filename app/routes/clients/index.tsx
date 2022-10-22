import type { Client } from "@prisma/client";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { Button, Table } from "flowbite-react";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";
import { ClientModal } from "~/components/ClientModal";

import Header from "~/components/Header";
import {
  createClient,
  deleteClient,
  editClient,
  getClients,
} from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { clientValidator } from "~/validators/clientValidation";

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
      const result = await clientValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      try {
        await createClient({
          address: result.data.address,
          name: result.data.name,
          phoneNumber: result.data.phoneNumber,
          isLegalEntity: result.data.isLegalEntity === "true",
          registrationNumber: result.data.registrationNumber,
        });

        return null;
      } catch (e: any) {
        if (e.meta?.target?.includes("registrationNumber")) {
          return validationError({
            fieldErrors: {
              registrationNumber:
                "Já existe um cliente cadastrado com este CPF ou CNPJ.",
            },
          });
        }
      }
    }

    case "edit": {
      const result = await clientValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await editClient({
        address: result.data.address,
        name: result.data.name,
        phoneNumber: result.data.phoneNumber,
        isLegalEntity: result.data.isLegalEntity === "true",
        registrationNumber: result.data.registrationNumber ?? null,
        id: Number(result.data.id),
      });

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

type ModalState = { show: boolean; client: null | Client };

export default function Clients() {
  const { clients } = useLoaderData<typeof loader>();

  const actionData = useActionData();
  const transition = useTransition();

  const [show, setShow] = useState(false);
  const [edition, setEdition] = useState<ModalState>({
    show: false,
    client: null,
  });

  const isAdding = transition.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setShow(false);
      setEdition({ show: false, client: null });
    }
  }, [isAdding, actionData]);

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-6 p-8">
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
                <Table.Cell>
                  <Link to={`/clients/${c.id}`}>{c.name}</Link>
                </Table.Cell>
                <Table.Cell>{c.address}</Table.Cell>
                <Table.Cell>
                  <Link
                    className="px-2 font-medium text-blue-600 hover:underline dark:text-blue-500"
                    to={`/clients/${c.id}`}
                  >
                    Ver detalhes
                  </Link>
                  |
                  <button
                    className="px-2 font-medium text-blue-600 hover:underline dark:text-blue-500"
                    // @ts-ignore
                    onClick={() => setEdition({ show: true, client: c })}
                  >
                    Editar
                  </button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </main>
      {show && <ClientModal onClose={() => setShow(false)} />}
      {edition.show && edition.client && (
        <ClientModal
          editionMode
          values={edition.client}
          onClose={() => setEdition({ show: false, client: null })}
        />
      )}
    </>
  );
}
