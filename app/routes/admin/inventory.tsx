import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
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

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return { rentables };
}

export async function action({ request }: ActionArgs) {
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
  values: Omit<Rentable, "createdAt" | "updatedAt"> | null;
}) {
  return (
    <Modal size="md" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editionMode ? "Editar" : "Novo"} item de Estoque
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method={editionMode ? "PUT" : "POST"} id="rentable-form">
            <Grid gap={2}>
              <input type="hidden" name="id" defaultValue={values?.id} />
              <FormControl>
                <FormLabel htmlFor="name">Nome</FormLabel>
                <Input
                  id="name"
                  required
                  name="name"
                  defaultValue={values?.name}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="description">Descrição</FormLabel>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={values?.description ?? ""}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="count">Quantidade</FormLabel>
                <Input
                  id="count"
                  required
                  name="count"
                  type="number"
                  defaultValue={values?.count}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="unitPrice">Valor Unitário</FormLabel>
                <InputGroup>
                  <InputLeftAddon>R$</InputLeftAddon>
                  <Input
                    id="unitPrice"
                    required
                    name="unitPrice"
                    type="number"
                    defaultValue={values?.unitPrice}
                  />
                </InputGroup>
              </FormControl>
            </Grid>
          </Form>
        </ModalBody>

        <ModalFooter gap="2">
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const navigation = useNavigation();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editData, setEditData] = useState<Omit<
    Rentable,
    "createdAt" | "updatedAt"
  > | null>(null);

  const isAdding = navigation.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      onClose();
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
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Nome</Th>
                <Th>Descrição</Th>
                <Th>Quantidade</Th>
                <Th>Preço unitário</Th>
                <Th>
                  <VisuallyHidden>Edit</VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {rentables.map((rentable) => (
                <Tr key={rentable.id}>
                  <Td>{rentable.id}</Td>
                  <Td> {rentable.name}</Td>
                  <Td> {rentable.description}</Td>
                  <Td>{rentable.count}</Td>
                  <Td>R$ {rentable.unitPrice}</Td>
                  <Td>
                    <Flex>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditData(rentable);
                          onOpen();
                        }}
                      />
                      <Form method="delete">
                        <input type="hidden" name="id" value={rentable.id} />
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
                      </Form>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        {isOpen && (
          <RentableModal
            onClose={onClose}
            values={editData}
            editionMode={Boolean(editData)}
          />
        )}
      </Container>
    </>
  );
}
