import { Form, useActionData } from "@remix-run/react";
import { Button, Label, Modal, TextInput } from "flowbite-react";

interface ClientModalProps {
  onClose: () => void;
  editionMode?: boolean;
  values?: {
    id: number;
    address: string;
    name: string;
    phoneNumber: string;
    registrationNumber: string;
    isLegalEntity: boolean;
  };
}

export function ClientModal({
  onClose,
  editionMode,
  values,
}: ClientModalProps) {
  const actionData = useActionData();

  function hasError(field: string) {
    return actionData?.errors?.fieldErrors?.[field]
      ? { border: "2px solid red" }
      : {};
  }

  return (
    <Modal show onClose={onClose}>
      <Modal.Header>{editionMode ? "Editar" : "Criar"} Cliente</Modal.Header>
      <Modal.Body>
        <Form method="post" id="client-form" className="flex flex-col gap-4">
          <input type="hidden" name="id" defaultValue={values?.id} />
          <div>
            <Label htmlFor="name" value="Nome" />
            <TextInput
              id="name"
              name="name"
              required
              defaultValue={values?.name}
              style={hasError("name")}
            />
            {actionData?.errors?.fieldErrors?.name && (
              <span className="text-xs italic text-red-600">
                {actionData?.errors?.fieldErrors?.name[0]}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="address" value="Endereço" />
            <TextInput
              id="address"
              name="address"
              required
              defaultValue={values?.address}
              style={hasError("address")}
            />
            {actionData?.errors?.fieldErrors?.address && (
              <span className="text-xs italic text-red-600">
                {actionData?.errors?.fieldErrors?.address[0]}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="phoneNumber" value="Telefone" />
            <TextInput
              id="phoneNumber"
              name="phoneNumber"
              defaultValue={values?.phoneNumber}
              minLength={10}
              required
              style={hasError("phoneNumber")}
            />
            {actionData?.errors?.fieldErrors?.phoneNumber && (
              <span className="text-xs italic text-red-600">
                {actionData?.errors?.fieldErrors?.phoneNumber[0]}
              </span>
            )}
          </div>
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
              Pessoa Jurídica
            </legend>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="isLegalEntity-option-1"
                  type="radio"
                  name="isLegalEntity"
                  value="true"
                  className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:focus:bg-blue-600 dark:focus:ring-blue-600"
                />
                <label
                  htmlFor="isLegalEntity-option-1"
                  className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Sim
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="isLegalEntity-option-2"
                  type="radio"
                  name="isLegalEntity"
                  value="false"
                  className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:focus:bg-blue-600 dark:focus:ring-blue-600"
                  defaultChecked
                />
                <label
                  htmlFor="isLegalEntity-option-2"
                  className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Não
                </label>
              </div>
            </div>
          </fieldset>
          <div>
            <Label htmlFor="registrationNumber" value="CNPJ/CPF" />
            <TextInput
              id="registrationNumber"
              name="registrationNumber"
              defaultValue={values?.registrationNumber}
              style={hasError("registrationNumber")}
              minLength={11}
            />
            {actionData?.errors?.fieldErrors?.registrationNumber && (
              <span className="text-xs italic text-red-600">
                {actionData?.errors?.fieldErrors?.registrationNumber[0]}
              </span>
            )}
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
