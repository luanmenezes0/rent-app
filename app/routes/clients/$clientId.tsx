import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useCatch,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { Button, Table } from "flowbite-react";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import BuildingSiteModal from "~/components/BuildingSiteModal";
import Header from "~/components/Header";
import { createBuildingSite } from "~/models/buildingSite.server";
import { getClient } from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { buildingSiteValidator } from "~/validators/buildingSiteValidator";

export async function loader({ request, params }: LoaderArgs) {
  await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  const client = await getClient(params.clientId);

  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ client });
}

export async function action({ request, params }: ActionArgs) {
  await requireUserId(request);

  invariant(params.clientId, "clientId not found");

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create-bs": {
      const result = await buildingSiteValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await createBuildingSite({
        address: result.data.address,
        clientId: Number(params.clientId),
        name: result.data.name,
      });

      return null;
    }

    default:
      throw new Error("unknown action");
  }
}

export default function Client() {
  const { client } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const transition = useTransition();

  const [show, setShow] = useState(false);

  const isAdding = transition.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setShow(false);
    }
  }, [isAdding, actionData]);

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-2 p-8">
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <dl>
          <dt className="font-bold">Endereço</dt>
          <dd>{client.address}</dd>

          <dt className="font-bold">Telefone</dt>
          <dd>{client.phoneNumber}</dd>

          {client.isLegalEntity ? (
            <>
              <dt className="font-bold">CNPJ</dt>
              <dd>{client.registrationNumber || "-"}</dd>
            </>
          ) : (
            <>
              <dt className="font-bold">CPF</dt>
              <dd>{client.registrationNumber || "-"}</dd>
            </>
          )}
        </dl>
        <Button onClick={() => setShow(true)}>Adicionar Obra</Button>
        <div>
          <Table striped>
            <caption>
              <h3 className="p-2 text-left text-xl font-bold">Obras</h3>
            </caption>
            <Table.Head>
              <Table.HeadCell>Id</Table.HeadCell>
              <Table.HeadCell>Nome</Table.HeadCell>
              <Table.HeadCell>Endereço</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">Ações</span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {client.buildingSites.map((bs) => (
                <Table.Row
                  key={bs.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <Link to={`/building-sites/${bs.id}`}>{bs.id}</Link>
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
        </div>
        <hr className="my-4" />
      </main>
      {show && (
        <BuildingSiteModal client={client} onClose={() => setShow(false)} />
      )}
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Cliente não encontrado</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
