import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type { BuildingSite } from "@prisma/client";
import { Form, useActionData } from "@remix-run/react";

type Props = {
  onClose: () => void;
  client: { id: number; address: string };
  editionMode?: boolean;
  values?: Omit<BuildingSite, "createdAt" | "updatedAt">;
};

export default function BuildingSiteModal(props: Props) {
  const { onClose, client, editionMode = false, values } = props;

  const actionData = useActionData<{ fieldErrors: Partial<BuildingSite> }>();

  return (
    <Modal size="xl" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editionMode ? "Editar" : "Nova"} Obra</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form
            method="POST"
            id="buiding-site-form"
            className="flex flex-col gap-4"
          >
            <VStack spacing={2}>
              <input type="hidden" name="clientId" value={client.id} />
              <input type="hidden" name="id" value={values?.id} />
              <FormControl isInvalid={Boolean(actionData?.fieldErrors?.name)}>
                <FormLabel htmlFor="name">Nome</FormLabel>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={values?.name}
                />
                {actionData?.fieldErrors?.name && (
                  <FormErrorMessage>
                    {actionData?.fieldErrors?.name}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={Boolean(actionData?.fieldErrors?.address)}
              >
                <FormLabel htmlFor="address">Endereço</FormLabel>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={editionMode ? values?.address : client.address}
                  required
                />
                {actionData?.fieldErrors?.address && (
                  <FormErrorMessage>
                    {actionData?.fieldErrors?.address}
                  </FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="ghost" mx="4">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="buiding-site-form"
            name="_action"
            value={editionMode ? "edit-bs" : "create-bs"}
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
