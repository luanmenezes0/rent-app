import type { BuildingSite } from "@prisma/client";
import { Form, useActionData } from "@remix-run/react";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import FormFieldError from "./FormFieldError";

type Props = {
  onClose: () => void;
  client: { id: number; address: string };
  editionMode?: boolean;
  values?: Omit<BuildingSite, "createdAt" | "updatedAt">;
};

export default function BuildingSiteModal(props: Props) {
  const { onClose, client, editionMode = false, values } = props;

  const actionData = useActionData<{ fieldErrors: Partial<BuildingSite> }>();

  function hasError(field: keyof BuildingSite) {
    return actionData?.fieldErrors?.[field] ? { border: "2px solid red" } : {};
  }

  return (
    <Modal show onClose={onClose}>
      <Modal.Header>{editionMode ? "Editar" : "Nova"} Obra</Modal.Header>
      <Modal.Body>
        <Form
          method="post"
          id="buiding-site-form"
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="id" value={values?.id} />
          <div>
            <Label htmlFor="name" value="Nome" />
            <TextInput
              id="name"
              name="name"
              required
              defaultValue={values?.name}
              style={hasError("name")}
            />
            {actionData?.fieldErrors?.name && (
              <FormFieldError>{actionData?.fieldErrors?.name}</FormFieldError>
            )}
          </div>
          <div>
            <Label htmlFor="address" value="Endereço" />
            <TextInput
              id="address"
              name="address"
              defaultValue={editionMode ? values?.address : client.address}
              required
              style={hasError("address")}
            />
            {actionData?.fieldErrors?.address && (
              <FormFieldError>
                {actionData?.fieldErrors?.address}
              </FormFieldError>
            )}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="buiding-site-form"
          name="_action"
          value={editionMode ? "edit-bs" : "create-bs"}
        >
          {editionMode ? "Editar" : "Criar"}
        </Button>
        <Button onClick={onClose} color="gray">
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
