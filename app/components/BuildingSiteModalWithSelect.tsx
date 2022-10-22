import type { Client } from "@prisma/client";
import { Form, useFetcher } from "@remix-run/react";
import { Button, Checkbox, Label, Modal, TextInput } from "flowbite-react";
import type { FormEvent} from "react";
import { useEffect } from "react";

export function BuildingSiteModal({ onClose }: { onClose: () => void }) {
  const fetcher = useFetcher<Client[]>();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load("/clientslist");
    }
  }, [fetcher]);

  function onChange(e: FormEvent<HTMLFormElement>) {
    const formElements = e.currentTarget.elements;
    const checkbox = formElements.namedItem('useClientAddress') as HTMLInputElement;
    const clientSelect = formElements.namedItem('clientId') as HTMLSelectElement;
    const clientAddress = formElements.namedItem('address') as HTMLInputElement;

    if (checkbox.checked && clientSelect.value) {
      const client = fetcher.data?.find(
        (c) => c.id === Number(clientSelect.value)
      );

      clientAddress.value = client?.address ?? "";
    }
  }

  return (
    <Modal show onClose={onClose}>
      <Modal.Header>Nova Obra</Modal.Header>
      <Modal.Body>
        <Form
          method="post"
          id="buiding-site-form"
          className="flex flex-col gap-4"
          onChange={onChange}
        >
          <div>
            <Label htmlFor="client" value="Cliente" />
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
          </div>
          <div>
            <Label htmlFor="name" value="Nome" />
            <TextInput id="name" name="name" required />
          </div>
          <div className="flex gap-2">
            <Checkbox id="use-client-address" name="useClientAddress" />
            <Label htmlFor="use-client-address">Usar Endereço do cliente</Label>
          </div>
          <div>
            <Label htmlFor="address" value="Endereço" />
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
