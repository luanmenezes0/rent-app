import {
  Button,
  Checkbox,
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
import type { BuildingSite, Client } from "@prisma/client";
import { useActionData, useFetcher } from "@remix-run/react";
import { SerializeFrom } from "@remix-run/server-runtime";
import { useState } from "react";

import { BuildingSiteStatus } from "~/utils";

interface Props {
  onClose: () => void;
  client: SerializeFrom<Client>;
  editionMode?: boolean;
  values?: SerializeFrom<BuildingSite>;
}

export default function BuildingSiteModal(props: Props) {
  const { onClose, client, editionMode = false, values } = props;

  const actionData = useActionData<{ fieldErrors: Partial<BuildingSite> }>();

  const fetcher = useFetcher();

  const [status, setStatus] = useState(() => {
    if (editionMode && values) {
      return values.status;
    }
    return BuildingSiteStatus.ACTIVE;
  });

  function submit(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    const form = Object.fromEntries(new FormData(event.currentTarget.form!));
    const action = editionMode ? "edit-bs" : "create-bs";
    fetcher.submit({ ...form, status, _action: action }, { method: "POST" });
  }

  return (
    <Modal size="xl" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editionMode ? "Editar" : "Nova"} Obra</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <fetcher.Form
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
                  defaultValue={
                    editionMode
                      ? values?.name
                      : `OBRA ${client.name.split(" ")[0]}`
                  }
                />
                {actionData?.fieldErrors?.name ? <FormErrorMessage>
                    {actionData?.fieldErrors?.name}
                  </FormErrorMessage> : null}
              </FormControl>
              <FormControl
                isInvalid={Boolean(actionData?.fieldErrors?.address)}
              >
                <FormLabel htmlFor="address">Endereço</FormLabel>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={
                    editionMode
                      ? values?.address
                      : `${client.address}, ${client.neighborhood} - ${client.city}`
                  }
                  required
                />
                {actionData?.fieldErrors?.address ? <FormErrorMessage>
                    {actionData?.fieldErrors?.address}
                  </FormErrorMessage> : null}
              </FormControl>
              <FormControl display="flex" alignItems="baseline">
                <FormLabel htmlFor="status">Ativa</FormLabel>
                <Checkbox
                  name="status"
                  id="status"
                  onChange={({ target }) => setStatus(target.checked ? 1 : 2)}
                  defaultChecked={status === BuildingSiteStatus.ACTIVE}
                  value={status === BuildingSiteStatus.ACTIVE ? 1 : 2}
                />
              </FormControl>
            </VStack>
          </fetcher.Form>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="ghost" mx="4">
            Cancelar
          </Button>
          <Button form="buiding-site-form" onClick={submit}>
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
