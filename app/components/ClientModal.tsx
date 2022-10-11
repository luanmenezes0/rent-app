import { Form } from "@remix-run/react";
import { Button, Label, Modal, TextInput } from "flowbite-react";

interface ClientModalProps {
  onClose: () => void;
  editionMode?: boolean;
  values?: { id: number; address: string; name: string };
}

export function ClientModal({
  onClose,
  editionMode,
  values,
}: ClientModalProps) {
  return (
    <Modal show onClose={onClose}>
      <Modal.Header>{editionMode ? "Editar" : "Criar"} Cliente</Modal.Header>
      <Modal.Body>
        <Form method="post" id="client-form" className="flex flex-col gap-4">
          <input type="hidden" name="id" defaultValue={values?.id} />
          <div>
            <div className="mb-2 block">
              <Label htmlFor="name" value="Nome" />
            </div>
            <TextInput
              id="name"
              name="name"
              required
              defaultValue={values?.name}
            />
          </div>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="address" value="Endereço" />
            </div>
            <TextInput
              id="address"
              name="address"
              defaultValue={values?.address}
            />
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="client-form"
          name="_action"
          value={editionMode ? "edit" : "create"}
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
