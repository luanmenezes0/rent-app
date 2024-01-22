import { SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
} from "@chakra-ui/react";
import type { Client } from "@prisma/client";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link as RemixLink,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useEffect, useState } from "react";

import { validationError } from "remix-validated-form";
import { ClientModal } from "~/components/ClientModal";
import Header from "~/components/Header";
import { PaginationBar } from "~/components/PaginationBar";
import {
  createClient,
  deleteClient,
  editClient,
  getClients,
} from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { clientValidator } from "~/validators/clientValidation";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const top = Number(url.searchParams.get("$top")) || 10;
  const skip = Number(url.searchParams.get("$skip")) || 0;

  const { count, data } = await getClients({ top, skip });

  return json({ clients: data, count });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create": {
      const result = await clientValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      try {
        const client = await createClient({
          address: result.data.address,
          name: result.data.name,
          phoneNumber: result.data.phoneNumber,
          isLegalEntity: result.data.isLegalEntity === "true",
          registrationNumber: result.data.registrationNumber,
          city: result.data.city,
          state: result.data.state,
          neighborhood: result.data.neighborhood,
          email: result.data.email ?? null,
          streetCode: result.data.streetCode ?? null,
        });

        return redirect(`/clients/${client.id}`);
      } catch (e: any) {
        if (e.meta?.target?.includes("registrationNumber")) {
          return validationError({
            fieldErrors: {
              registrationNumber:
                "Já existe um cliente cadastrado com este CPF ou CNPJ.",
            },
          });
        }
      }

      return null;
    }

    case "edit": {
      const result = await clientValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await editClient({
        address: result.data.address,
        name: result.data.name,
        phoneNumber: result.data.phoneNumber,
        isLegalEntity: result.data.isLegalEntity === "true",
        registrationNumber: result.data.registrationNumber ?? null,
        id: Number(result.data.id),
        city: result.data.city,
        state: result.data.state,
        neighborhood: result.data.neighborhood,
        email: result.data.email ?? null,
        streetCode: result.data.streetCode ?? null,
      });

      return null;
    }

    case "delete": {
      const id = formData.get("id") as string;

      await deleteClient(id);
      return null;
    }

    default:
      throw new Error("unknown action");
  }
}

type ModalState = {
  show: boolean;
  client: null | Omit<Client, "createdAt" | "updatedAt">;
};

export default function Clients() {
  const { clients, count } = useLoaderData<typeof loader>();

  const actionData = useActionData();
  const navigation = useNavigation();

  const fetcher = useFetcher();

  const [show, setShow] = useState(false);
  const [edition, setEdition] = useState<ModalState>({
    show: false,
    client: null,
  });

  const isAdding = navigation.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setShow(false);
      setEdition({ show: false, client: null });
    }
  }, [isAdding, actionData]);

  const data = fetcher.data || clients;

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Clientes
        </Heading>
        <Flex justifyContent="space-between">
          <Button maxW="fit-content" onClick={() => setShow(true)}>
            Criar Cliente
          </Button>
          <fetcher.Form method="GET" action="/clientslist">
            <InputGroup width="auto">
              <InputLeftAddon>
                <SearchIcon />
              </InputLeftAddon>
              <Input type="search" placeholder="Buscar cliente" name="search" />
            </InputGroup>
          </fetcher.Form>
        </Flex>

        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Nome</Th>
                <Th>Endereço</Th>
                <Th>
                  <VisuallyHidden>Ações</VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link as={RemixLink} to={`/clients/${c.id}`}>
                      {c.id}
                    </Link>
                  </Td>
                  <Td>
                    <Link as={RemixLink} to={`/clients/${c.id}`}>
                      {c.name}
                    </Link>
                  </Td>
                  <Td>{c.address}</Td>
                  <Td>
                    <HStack>
                      <Link as={RemixLink} to={`/clients/${c.id}`} px="4">
                        Ver detalhes
                      </Link>
                      <Center height="30px">
                        <Divider orientation="vertical" />
                      </Center>
                      <Button
                        variant="ghost"
                        onClick={() => setEdition({ show: true, client: c })}
                      >
                        Editar
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <PaginationBar total={count} />
      </Container>
      {show && <ClientModal onClose={() => setShow(false)} />}
      {edition.show && edition.client && (
        <ClientModal
          editionMode
          values={edition.client}
          onClose={() => setEdition({ show: false, client: null })}
        />
      )}
    </>
  );
}
