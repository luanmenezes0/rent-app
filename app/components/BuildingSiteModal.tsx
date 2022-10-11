import type { Client } from "@prisma/client";
import { Form, useFetcher } from "@remix-run/react";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import { useEffect } from "react";

function ClientsListSelect() {
  const fetcher = useFetcher<Client[]>();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load("/clientslist");
    }
  }, [fetcher]);

  return (
    <select
      id="client"
      name="clientId"
      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
    >
      <option selected>Selecione um cliente</option>
      {fetcher.data?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function BuildingSiteModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal show onClose={onClose}>
      <Modal.Header>Nova Obra</Modal.Header>
      <Modal.Body>
        <Form
          method="post"
          id="buiding-site-form"
          className="flex flex-col gap-4"
        >
          <div>
            <div className="mb-2 block">
              <Label htmlFor="client" value="Cliente" />
            </div>
            <ClientsListSelect />
          </div>
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
            <TextInput id="address" name="address" required />
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="buiding-site-form"
          name="_action"
          value="create"
        >
          Criar
        </Button>
        <Button onClick={onClose} color="gray">
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
