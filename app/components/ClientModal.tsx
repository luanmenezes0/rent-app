import { Form } from "@remix-run/react";
import { Button, Label, Modal, TextInput } from "flowbite-react";

export function ClientModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal show onClose={onClose}>
      <Modal.Header>Novo Cliente</Modal.Header>
      <Modal.Body>
        <Form method="post" id="client-form" className="flex flex-col gap-4">
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
        <Button type="submit" form="client-form" name="_action" value="create">
          Criar
        </Button>
        <Button onClick={onClose} color="gray">
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
