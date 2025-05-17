import { SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  Link,
  Table,
  useDisclosure,
  VisuallyHidden,
} from "@chakra-ui/react";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link as RemixLink,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { validationError } from "remix-validated-form";

import { ClientModal } from "~/components/ClientModal";
import Header from "~/components/Header";
import {
  PaginationBar,
  setSearchParamsString,
} from "~/components/PaginationBar";
import { createClient, getClients } from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { PAGINATION_LIMIT } from "~/utils";
import { clientValidator } from "~/validators/clientValidation";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const top = Number(url.searchParams.get("$top")) || PAGINATION_LIMIT;
  const skip = Number(url.searchParams.get("$skip")) || 0;
  const search = url.searchParams.get("search") ?? undefined;

  const { count, data } = await getClients({ top, skip, search });

  return json({ clients: data, count });
}

export async function action({ request }: ActionFunctionArgs) {
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
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
          const errors = e.meta?.target as string[];
          if (errors.includes("registrationNumber")) {
            return validationError({
              fieldErrors: {
                registrationNumber:
                  "Já existe um cliente cadastrado com este CPF ou CNPJ.",
              },
            });
          }
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

  const { onClose, open, onOpen } = useDisclosure();

  function onChange(e: React.FormEvent<HTMLInputElement>) {
    const value = e.currentTarget.value;

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
            <Flex gap={1}>
              <InputGroup width="auto">
                <Input
                  onChange={onChange}
                  type="search"
                  placeholder="Buscar cliente"
                  name="search"
                />
              </InputGroup>
              <Button type="submit" variant="outline">
                <SearchIcon />
              </Button>
            </Flex>
          </Form>
        </Flex>

        <>
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Id</Table.ColumnHeader>
                <Table.ColumnHeader>Nome</Table.ColumnHeader>
                <Table.ColumnHeader>Endereço</Table.ColumnHeader>
                <Table.ColumnHeader>
                  <VisuallyHidden>Ações</VisuallyHidden>
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {clients.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell>
                    <Link as={RemixLink} href={`/clients/${c.id}`}>
                      {c.id}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Link as={RemixLink} href={`/clients/${c.id}`}>
                      {c.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{c.address.slice(0, 46)}</Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <Link as={RemixLink} href={`/clients/${c.id}`} px="4">
                        Ver detalhes
                      </Link>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </>
        <PaginationBar total={count} />
      </Container>
      {open ? <ClientModal onClose={onClose} /> : null}
    </>
  );
}
