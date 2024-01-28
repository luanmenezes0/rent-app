import { SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Container,
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
  useDisclosure,
  VisuallyHidden,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link as RemixLink,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useEffect } from "react";

import { validationError } from "remix-validated-form";
import { ClientModal } from "~/components/ClientModal";
import Header from "~/components/Header";
import {
  PaginationBar,
  setSearchParamsString,
} from "~/components/PaginationBar";
import { createClient, getClients } from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { clientValidator } from "~/validators/clientValidation";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const top = Number(url.searchParams.get("$top")) || 10;
  const skip = Number(url.searchParams.get("$skip")) || 0;
  const search = url.searchParams.get("search") ?? undefined;

  const { count, data } = await getClients({ top, skip, search });

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

    default:
      throw new Error("unknown action");
  }
}

export default function Clients() {
  const { clients, count } = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();

  const { onClose, isOpen, onOpen } = useDisclosure();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isAdding = navigation.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      onClose();
    }
  }, [isAdding, actionData, onClose]);

  const data = clients;

  function onChange(e: React.FormEvent<HTMLInputElement>) {
    const value = e.currentTarget.value;

    console.log(value);

    if (!value) {
      setSearchParamsString(searchParams, { search: "" });
    }
  }

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Clientes
        </Heading>
        <Flex justifyContent="space-between">
          <Button maxW="fit-content" onClick={onOpen}>
            Criar Cliente
          </Button>
          <Form>
            <InputGroup width="auto">
              <InputLeftAddon>
                <SearchIcon />
              </InputLeftAddon>
              <Input
                onChange={onChange}
                type="search"
                placeholder="Buscar cliente"
                name="search"
              />
            </InputGroup>
          </Form>
        </Flex>

        <TableContainer>
          <Table size="md">
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
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <PaginationBar total={count} />
      </Container>
      {isOpen && <ClientModal onClose={onClose} />}
    </>
  );
}
