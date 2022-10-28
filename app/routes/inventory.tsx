import { Form, useLoaderData, useTransition } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { Button, Label, Modal, Table, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiCheck } from "react-icons/hi";
import { validationError } from "remix-validated-form";
import Header from "~/components/Header";
import {
  createRentable,
  editRentable,
  getRentables,
} from "~/models/inventory.server.";
import { requireUserId } from "~/session.server";
import { rentableValidator } from "~/validators/rentableValidator";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return { rentables };
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();

  const action = formData.get("_action");

  switch (action) {
    case "create": {
      const result = await rentableValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await createRentable({
        name: result.data.name,
        count: Number(result.data.count),
      });

      return null;
    }

    case "edit": {
      const id = formData.get("id") as string;
      const count = formData.get("count") as string;

      await editRentable({ id: Number(id), count: Number(count) });

      return null;
    }

    default:
      throw new Error("Invalid action");
  }
}

function RentableModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal show onClose={onClose} size="md">
      <Modal.Header>Adicionar item de estoque</Modal.Header>
      <Modal.Body>
        <Form method="post" className="space-y-4" id="rentable-form">
          <div>
            <Label htmlFor="name" value="Nome" />
            <TextInput id="name" required name="name" />
          </div>
          <div>
            <Label htmlFor="count" value="Quantidade" />
            <TextInput id="count" required name="count" type="number" />
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} color="gray">
          Cancelar
        </Button>
        <Button
          type="submit"
          form="rentable-form"
          name="_action"
          value="create"
        >
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function useModal(actionKey: string) {
  const [isModalOpen, showModal] = useState(false);

  const transition = useTransition();

  const submitting = transition.state === "submitting";
  const action = transition.submission?.formData.get("_action");

  useEffect(() => {
    if (!submitting && action === actionKey) {
      showModal(false);
    }
  }, [submitting, action, actionKey]);

  return [isModalOpen, showModal] as const;
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();

  const [edit, setEdit] = useState<number | null>(null);

  const [isModalOpen, showModal] = useModal("create");

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8">
        <h1 className="text-6xl font-bold">Estoque</h1>
        <button
          type="button"
          onClick={() => showModal(true)}
          className="w-fit rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Criar novo item
        </button>
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
                <Table.Row
                  key={rentable.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {rentable.id}
                  </Table.Cell>
                  <Table.Cell> {rentable.name}</Table.Cell>
                  <Table.Cell>
                    {edit === rentable.id ? (
                      <Form
                        method="put"
                        className="flex items-center gap-2"
                        onSubmit={() => setEdit(null)}
                      >
                        <input type="hidden" name="id" value={rentable.id} />
                        <TextInput
                          type="number"
                          defaultValue={rentable.count}
                          name="count"
                        />
                        <button
                          name="_action"
                          value="edit"
                          className="group flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-green-700 p-0.5 text-center font-medium text-white hover:bg-green-800 focus:z-10 focus:ring-4 focus:ring-green-300 disabled:hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 dark:disabled:hover:bg-green-600"
                        >
                          <HiCheck className="text-xs" />
                        </button>
                      </Form>
                    ) : (
                      rentable.count
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      color="grey"
                      size="sm"
                      onClick={() => setEdit(rentable.id)}
                    >
                      Editar
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        {isModalOpen && <RentableModal onClose={() => showModal(false)} />}
      </main>
    </>
  );
}
