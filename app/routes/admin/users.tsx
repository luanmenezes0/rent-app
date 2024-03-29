import { DeleteIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
  useClipboard,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";

import { MyAlertDialog } from "~/components/AlertDialog";
import Header from "~/components/Header";
import {
  SERVER_SECRET,
  deleteUser,
  editUser,
  getUsers,
} from "~/models/user.server";
import { requireUserId } from "~/session.server";
import { useUser, userRoles } from "~/utils";
import { userValidator } from "~/validators/userValidator";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const users = await getUsers();

  return { users };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);

  const formData = await request.formData();

  const action = formData.get("_action");

  switch (action) {
    case "create": {
      const hash = await bcrypt.hash(SERVER_SECRET, 10);

      const url = new URL(request.url);

      const link = `${url.origin}/join?token=${encodeURIComponent(hash)}`;

      return { link };
    }

    case "edit": {
      const result = await userValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await editUser(result.data.userId, result.data.role);

      return null;
    }

    case "delete": {
      const userId = formData.get("userId");

      if (typeof userId === "string") {
        await deleteUser(userId);
      }

      return null;
    }

    default:
      throw new Error("Invalid action");
  }
}

function UserModal({ onClose }: { onClose: () => void }) {
  const actionData = useActionData<{ link?: string }>();

  const { onCopy, setValue, hasCopied } = useClipboard("");

  useEffect(() => {
    setValue(actionData?.link ?? "");
  }, [actionData?.link, setValue]);

  return (
    <Modal size="lg" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Novo usuário</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method="POST" id="user-form">
            <input type="hidden" name="id" />
            <FormControl>
              <FormLabel htmlFor="name">E-mail</FormLabel>
              <Input id="email" required name="email" type="email" />
            </FormControl>
          </Form>
          {actionData?.link ? (
            <Flex alignItems="center" gap={2}>
              <Box bgColor="teal.800" p={2} my={2} borderRadius={4}>
                <Text wordBreak="break-all" fontSize="12px">
                  {actionData?.link}
                </Text>
              </Box>
              <Button type="button" onClick={onCopy}>
                {hasCopied ? "Copied!" : "Copy"}
              </Button>
            </Flex>
          ) : null}
        </ModalBody>
        <ModalFooter gap="2">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="user-form"
            name="_action"
            value="create"
            disabled={Boolean(actionData?.link)}
          >
            Criar Link
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const user = useUser();

  const deleteModal = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  function onChangeRole(isChecked: boolean, userId: string) {
    fetcher.submit(
      {
        role: isChecked ? userRoles.ADMIN : userRoles.USER,
        _action: "edit",
        userId,
      },
      { method: "PUT" },
    );
  }

  function deleteUser() {
    fetcher.submit(
      { _action: "delete", userId: idToDelete },
      { method: "DELETE" },
    );
    deleteModal.onClose();
  }

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Usuários
        </Heading>
        <Button maxW="fit-content" onClick={onOpen}>
          Novo usuário
        </Button>
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Email</Th>
                <Th>Administrador?</Th>
                <Th>Data de criação</Th>
                {isAdmin ? (
                  <Th>
                    <VisuallyHidden>Ações</VisuallyHidden>
                  </Th>
                ) : null}
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.id}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Switch
                      defaultChecked={user.role === userRoles.ADMIN}
                      onChange={(e) => onChangeRole(e.target.checked, user.id)}
                    />
                  </Td>
                  <Td>
                    {dayjs(user.createdAt)
                      .tz("America/Fortaleza")
                      .format("DD/MM/YYYY")}
                  </Td>
                  <Td>
                    {isAdmin ? (
                      <IconButton
                        aria-label="Excluir Usuário"
                        icon={<DeleteIcon />}
                        onClick={() => {
                          setIdToDelete(user.id);
                          deleteModal.onOpen();
                        }}
                        variant="ghost"
                        colorScheme="red"
                        isRound
                        size="sm"
                      />
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Container>
      {isOpen ? <UserModal onClose={onClose} /> : null}
      <MyAlertDialog
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setIdToDelete(null);
          deleteModal.onClose();
        }}
        onDelete={deleteUser}
        title="Excluir usuário"
      />
    </>
  );
}
