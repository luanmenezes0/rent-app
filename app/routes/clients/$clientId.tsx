import {
  Badge,
  Button,
  Container,
  Heading,
  HStack,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import invariant from "tiny-invariant";
import dayjs from "dayjs";

import BuildingSiteModal from "~/components/BuildingSiteModal";
import BuildingSiteStatusLabel from "~/components/BuildingSiteStatusLabel";
import { ClientModal } from "~/components/ClientModal";
import Header from "~/components/Header";
import { createBuildingSite } from "~/models/buildingSite.server";
import { editClient, getClient } from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { BuildingSiteSchema } from "~/validators/buildingSiteValidator";
import { ClientSchema } from "~/validators/clientValidation";
import { parseZodError, validationError } from "~/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  const client = await getClient(params.clientId);

  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }

  return { client };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);

  invariant(params.clientId, "clientId not found");

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create-bs": {
      const result = BuildingSiteSchema.safeParse(
        Object.fromEntries(formData.entries()),
      );

      if (!result.success) {
        return validationError(parseZodError(result.error));
      }

      await createBuildingSite({
        address: result.data.address,
        clientId: Number(params.clientId),
        name: result.data.name,
      });

      return null;
    }

    case "edit": {
      const result = ClientSchema.safeParse(
        Object.fromEntries(formData.entries()),
      );

      if (!result.success) {
        return validationError(parseZodError(result.error));
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

    default:
      throw new Error("unknown action");
  }
}

export default function Client() {
  const { client } = useLoaderData<typeof loader>();

  const { isOpen, onClose, onOpen } = useDisclosure();

  const [show, setShow] = useState(false);

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <VStack>
          <Text>Detalhes do Cliente</Text>
          <Heading as="h1" size="xl">
            {client.name}
          </Heading>
          <HStack>
            <Button variant="outline" onClick={onOpen}>
              Editar
            </Button>
            <Button
              variant="outline"
              maxW="fit-content"
              onClick={() => setShow(true)}
            >
              Adicionar Obra
            </Button>
            <Button
              as={Link}
              to={`/budgets/new?clientId=${client.id}`}
              variant="outline"
            >
              Criar Orçamento
            </Button>
          </HStack>
        </VStack>

        <VStack as="dl" align="flex-start">
          <div>
            <Text fontWeight="bold" as="dt">
              Endereço
            </Text>
            <dd>
              {client.address}, {client.neighborhood}
            </dd>
            <dd>
              {client.city} - {client.state}
            </dd>
          </div>

          <div>
            <Text fontWeight="bold" as="dt">
              Telefone
            </Text>
            <dd>{client.phoneNumber}</dd>
          </div>

          {client.isLegalEntity ? (
            <div>
              <Text fontWeight="bold" as="dt">
                CNPJ
              </Text>
              <dd>{client.registrationNumber || "-"}</dd>
            </div>
          ) : (
            <div>
              <Text fontWeight="bold" as="dt">
                CPF
              </Text>
              <dd>{client.registrationNumber || "-"}</dd>
            </div>
          )}
        </VStack>

        <TableContainer>
          <Table>
            <TableCaption>Obras</TableCaption>
            <Thead>
              <Tr>
                <Th>Id</Th>
                <Th>Nome</Th>
                <Th>Endereço</Th>
                <Th>Status</Th>
                <Th>
                  <VisuallyHidden>Ações</VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {client.buildingSites.map((bs) => (
                <Tr key={bs.id}>
                  <Td>
                    <Link to={`/building-sites/${bs.id}`}>{bs.id}</Link>
                  </Td>
                  <Td>{bs.name}</Td>
                  <Td>{bs.address}</Td>
                  <Td>
                    <BuildingSiteStatusLabel status={bs.status} />
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Link to={`/building-sites/${bs.id}`}>Ver detalhes</Link>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <TableContainer>
          <Table>
            <TableCaption>Orçamentos</TableCaption>
            <Thead>
              <Tr>
                <Th>Canteiro</Th>
                <Th>Data de Validade</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>
                  <VisuallyHidden>Ações</VisuallyHidden>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {client.budgets.map((budget) => (
                <Tr key={budget.id}>
                  <Td>{budget.buildingSite.name}</Td>
                  <Td>{dayjs(budget.validityDate).format("DD/MM/YYYY")}</Td>
                  <Td>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(budget.total / 100)}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        budget.status === "DRAFT"
                          ? "gray"
                          : budget.status === "SENT"
                            ? "blue"
                            : budget.status === "APPROVED"
                              ? "green"
                              : "red"
                      }
                    >
                      {budget.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Link to={`/budgets/${budget.id}`}>Ver detalhes</Link>
                      {budget.status === "APPROVED" && (
                        <Button
                          as="a"
                          href={`/print-pdf?budgetId=${budget.id}`}
                          target="_blank"
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                        >
                          Imprimir
                        </Button>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Container>
      {show ? (
        <BuildingSiteModal client={client} onClose={() => setShow(false)} />
      ) : null}
      {isOpen ? (
        <ClientModal onClose={onClose} editionMode values={client} />
      ) : null}
    </>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
