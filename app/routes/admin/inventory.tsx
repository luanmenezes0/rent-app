import { EditIcon } from "@chakra-ui/icons";
import {
  Button,
  Container,
  Dialog,
  Field,
  Flex,
  Grid,
  Heading,
  IconButton,
  Input,
  InputGroup,
  Table,
  Textarea,
  VisuallyHidden,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  SerializeFrom,
} from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";

import Header from "~/components/Header";
import type { Rentable } from "~/models/inventory.server";
import {
  createRentable,
  deleteRentable,
  editRentable,
  getRentables,
} from "~/models/inventory.server";
import { requireUserId } from "~/session.server";
import { rentableValidator } from "~/validators/rentableValidator";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return { rentables };
}

export async function action({ request }: ActionFunctionArgs) {
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
        description: result.data.description,
        unitPrice: Number(result.data.unitPrice),
      });

      return null;
    }

    case "edit": {
      const id = formData.get("id") as string;
      const count = formData.get("count") as string;
      const description = formData.get("description") as string;
      const unitPrice = formData.get("unitPrice") as string;
      const name = formData.get("name") as string;

      await editRentable({
        name,
        id: Number(id),
        count: Number(count),
        description,
        unitPrice: Number(unitPrice),
      });

      return null;
    }

    case "delete": {
      const id = formData.get("id") as string;

      await deleteRentable(Number(id));

      return null;
    }

    default:
      throw new Error("Invalid action");
  }
}

function RentableModal({
  onClose,
  editionMode,
  values,
}: {
  onClose: () => void;
  editionMode?: boolean;
  values: SerializeFrom<Rentable> | null;
}) {
  return (
    <Dialog.Root size="md" open onClose={onClose}>
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>
              {editionMode ? "Editar" : "Novo"} item de Estoque
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Form method={editionMode ? "PUT" : "POST"} id="rentable-form">
              <Grid gap={2}>
                <input type="hidden" name="id" defaultValue={values?.id} />
                <Field.Root>
                  <Field.Label htmlFor="name">Nome</Field.Label>
                  <Input
                    id="name"
                    required
                    name="name"
                    defaultValue={values?.name}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label htmlFor="description">Descrição</Field.Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={values?.description ?? ""}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label htmlFor="count">Quantidade</Field.Label>
                  <Input
                    id="count"
                    required
                    name="count"
                    type="number"
                    defaultValue={values?.count}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label htmlFor="unitPrice">Valor Unitário</Field.Label>
                  <InputGroup startElement="R$">
                    <Input
                      id="unitPrice"
                      required
                      name="unitPrice"
                      type="number"
                      defaultValue={values?.unitPrice}
                    />
                  </InputGroup>
                </Field.Root>
              </Grid>
            </Form>
          </Dialog.Body>

          <Dialog.Footer gap="2">
            {/* <Form method="delete">
            <input type="hidden" name="id" value={values?.id} />
            <input type="hidden" name="_action" value="delete" />
            <IconButton
              size="sm"
              colorScheme="red"
              variant="ghost"
              type="submit"
              name="_action"
              value="delete"
              aria-label="Excluir"
              icon={<DeleteIcon />}
              rounded="full"
            />
          </Form> */}
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button
              type="submit"
              form="rentable-form"
              name="_action"
              value={editionMode ? "edit" : "create"}
            >
              Salvar
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();
  const actionData = useActionData<{
    fieldErrors: Record<string, string>;
  }>();
  const navigation = useNavigation();

  const { open, onOpen, onClose } = useDisclosure();
  const [editData, setEditData] = useState<SerializeFrom<Rentable> | null>(
    null,
  );

  const isAdding = navigation.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      onClose();
      setEditData(null);
    }
  }, [isAdding, actionData, onClose]);

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Estoque
        </Heading>
        <Button maxW="fit-content" onClick={onOpen}>
          Criar novo item
        </Button>

        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Id</Table.ColumnHeader>
              <Table.ColumnHeader>Nome</Table.ColumnHeader>
              <Table.ColumnHeader>Descrição</Table.ColumnHeader>
              <Table.ColumnHeader>Quantidade</Table.ColumnHeader>
              <Table.ColumnHeader>Preço unitário</Table.ColumnHeader>
              <Table.ColumnHeader>
                <VisuallyHidden>Edit</VisuallyHidden>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rentables.map((rentable) => (
              <Table.Row key={rentable.id}>
                <Table.Cell>{rentable.id}</Table.Cell>
                <Table.Cell> {rentable.name}</Table.Cell>
                <Table.Cell> {rentable.description}</Table.Cell>
                <Table.Cell>{rentable.count}</Table.Cell>
                <Table.Cell>R$ {rentable.unitPrice}</Table.Cell>
                <Table.Cell>
                  <Flex>
                    <IconButton
                      aria-label="Editar"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditData(rentable);
                        onOpen();
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {open ? (
          <RentableModal
            onClose={onClose}
            values={editData}
            editionMode={Boolean(editData)}
          />
        ) : null}
      </Container>
    </>
  );
}
