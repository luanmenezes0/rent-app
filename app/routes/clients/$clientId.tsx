import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useCatch, useLoaderData } from "@remix-run/react";
import { Button, Modal, Table } from "flowbite-react";
import invariant from "tiny-invariant";
import Header from "~/components/Header";
import { getBuildingSitesByClientId } from "~/models/buildingSite.server";
import { getClient } from "~/models/client.server";
import { HiOutlineExclamationCircle, HiTrash } from "react-icons/hi";
import { deleteNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";
import { useState } from "react";

export async function loader({ request, params }: LoaderArgs) {
  await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  const client = await getClient(params.clientId);

  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }

  const buildingSites = await getBuildingSitesByClientId(params.clientId);

  return json({ client, buildingSites });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  await deleteNote({ userId, id: params.clientId });

  return redirect("/clients");
}

function Popup({ onClose }: { onClose: () => void }) {
  return (
    <Modal show size="md" popup onClose={onClose}>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            Tem certeza que deseja excluir este cliente?
          </h3>
          <div className="flex justify-center gap-4">
            <Button color="failure">Sim</Button>
            <Button color="gray" onClick={onClose}>
              Não, cancelar
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default function Client() {
  const { client, buildingSites } = useLoaderData<typeof loader>();

  const [show, setShow] = useState(false);

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-2 p-8">
        <h2 className="text-2xl font-bold">{client.name}</h2>
        <p className="py-4">{client.address}</p>
        <div>
          <Table striped>
            <caption>
              <h3 className="text-black-400 p-2 text-left text-xl font-bold">
                Obras
              </h3>
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
              {buildingSites.map((bs) => (
                <Table.Row
                  key={bs.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <Link to={`/buildingSites/${bs.id}`}>{bs.id}</Link>
                  </Table.Cell>
                  <Table.Cell>{bs.name}</Table.Cell>
                  <Table.Cell>{bs.address}</Table.Cell>
                  <Table.Cell>
                    <Form
                      method="delete"
                      className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                    >
                      <input type="hidden" name="id" value={bs.id} />
                      <button name="_action" value="delete">
                        Deletar
                      </button>
                    </Form>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        <hr className="my-4" />
        <Button onClick={() => setShow(true)} color="failure">
          <HiTrash size={20} /> Deletar Cliente
        </Button>
      </main>
      {show && <Popup onClose={() => setShow(false)} />}
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
