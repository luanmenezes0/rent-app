import {
  Button,
  Checkbox,
  Dialog,
  Field,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type { BuildingSite, Client } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { SerializeFrom } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";

import { BuildingSiteStatus } from "~/utils";

interface Props {
  onClose: () => void;
  client: SerializeFrom<Client>;
  editionMode?: boolean;
  values?: SerializeFrom<BuildingSite>;
}

export default function BuildingSiteModal(props: Props) {
  const { onClose, client, editionMode = false, values } = props;

  const fetcher = useFetcher<{ fieldErrors: Partial<BuildingSite> }>();

  const [status, setStatus] = useState(() => {
    if (editionMode && values) {
      return values.status;
    }
    return BuildingSiteStatus.ACTIVE;
  });

  useEffect(() => {
    if (fetcher.data === null) {
      onClose();
    }
  }, [fetcher.data, onClose]);

  function onSubmit(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    const form = Object.fromEntries(new FormData(event.currentTarget.form!));
    const action = editionMode ? "edit-bs" : "create-bs";
    fetcher.submit({ ...form, status, _action: action }, { method: "POST" });
  }

  return (
    <Dialog.Root size="xl" isOpen onClose={onClose}>
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>{editionMode ? "Editar" : "Nova"} Obra</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <fetcher.Form
              method="POST"
              id="buiding-site-form"
              className="flex flex-col gap-4"
            >
              <VStack spacing={2}>
                <input type="hidden" name="clientId" value={client.id} />
                <input type="hidden" name="id" value={values?.id} />
                <Field.Root
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.name)}
                >
                  <Field.Label htmlFor="name">Nome</Field.Label>
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
                  {fetcher.data?.fieldErrors?.name ? (
                    <Field.ErrorText>
                      {fetcher.data?.fieldErrors?.name}
                    </Field.ErrorText>
                  ) : null}
                </Field.Root>
                <Field.Root
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.address)}
                >
                  <Field.Label htmlFor="address">Endereço</Field.Label>
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
                  {fetcher.data?.fieldErrors?.address ? (
                    <Field.ErrorText>
                      {fetcher.data?.fieldErrors?.address}
                    </Field.ErrorText>
                  ) : null}
                </Field.Root>
                <Field.Root display="flex" alignItems="baseline">
                  <Field.Label htmlFor="status">Ativa</Field.Label>
                  <Checkbox
                    name="status"
                    id="status"
                    onChange={({ target }) => setStatus(target.checked ? 1 : 2)}
                    defaultChecked={status === BuildingSiteStatus.ACTIVE}
                    value={status === BuildingSiteStatus.ACTIVE ? 1 : 2}
                  />
                </Field.Root>
              </VStack>
            </fetcher.Form>
          </Dialog.Body>
          <Dialog.Footer>
            <Button onClick={onClose} variant="ghost" mx="4">
              Cancelar
            </Button>
            <Button form="buiding-site-form" onClick={onSubmit}>
              Salvar
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
