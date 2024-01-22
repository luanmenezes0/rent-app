import { CheckIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
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
  Th,
  Thead,
  Tr,
  VisuallyHidden,
} from "@chakra-ui/react";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";
import Header from "~/components/Header";
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
      });

      return null;
    }

    case "edit": {
      const id = formData.get("id") as string;
      const count = formData.get("count") as string;

      await editRentable({ id: Number(id), count: Number(count) });

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

function RentableModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal size="md" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adicionar item de estoque</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method="post" id="rentable-form">
            <FormControl>
              <FormLabel htmlFor="name">Nome</FormLabel>
              <Input id="name" required name="name" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="count">Quantidade</FormLabel>
              <Input id="count" required name="count" type="number" />
            </FormControl>
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
            value="create"
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function useModal(actionKey: string) {
  const [isModalOpen, showModal] = useState(false);

  const transition = useTransition();

  const submitting = transition.state === "submitting";
  const action = transition.submission?.formData.get("_action");

  useEffect(() => {
    if (!submitting && action === actionKey) {
      showModal(false);
    }
  }, [submitting, action, actionKey]);

  return [isModalOpen, showModal] as const;
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();

  const [edit, setEdit] = useState<number | null>(null);

  const [isModalOpen, showModal] = useModal("create");

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Estoque
        </Heading>
        <Button maxW="fit-content" onClick={() => showModal(true)}>
          Criar novo item
        </Button>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Nome</Th>
                <Th>Quantidade</Th>
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
                  <Td>
                    {edit === rentable.id ? (
                      <Form method="put" onSubmit={() => setEdit(null)}>
                        <HStack justify="start">
                          <input type="hidden" name="id" value={rentable.id} />
                          <input type="hidden" name="_action" value="edit" />
                          <Input
                            type="number"
                            defaultValue={rentable.count}
                            name="count"
                            maxW="150px"
                          />
                          <IconButton
                            type="submit"
                            name="_action"
                            value="edit"
                            aria-label="Editar"
                            icon={<CheckIcon />}
                            rounded="full"
                          />
                        </HStack>
                      </Form>
                    ) : (
                      rentable.count
                    )}
                  </Td>
                  <Td>
                    <Flex>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEdit(rentable.id)}
                      >
                        Editar
                      </Button>

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
        {isModalOpen && <RentableModal onClose={() => showModal(false)} />}
      </Container>
    </>
  );
}
