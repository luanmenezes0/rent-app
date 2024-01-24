import {
  Button,
  Container,
  Heading,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import BuildingSiteModal from "~/components/BuildingSiteModal";
import Header from "~/components/Header";
import { createBuildingSite } from "~/models/buildingSite.server";
import { getClient } from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { buildingSiteValidator } from "~/validators/buildingSiteValidator";

export async function loader({ request, params }: LoaderArgs) {
  await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  const client = await getClient(params.clientId);

  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ client });
}

export async function action({ request, params }: ActionArgs) {
  await requireUserId(request);

  invariant(params.clientId, "clientId not found");

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create-bs": {
      const result = await buildingSiteValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await createBuildingSite({
        address: result.data.address,
        clientId: Number(params.clientId),
        name: result.data.name,
      });

      return null;
    }

    default:
      throw new Error("unknown action");
  }
}

export default function Client() {
  const { client } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const transition = useTransition();

  const [show, setShow] = useState(false);

  const isAdding = transition.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setShow(false);
    }
  }, [isAdding, actionData]);

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <VStack>
          <Text>Detalhes do Cliente</Text>
          <Heading as="h1" size="xl">
            {client.name}
          </Heading>
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
        <Button maxW="fit-content" onClick={() => setShow(true)}>
          Adicionar Obra
        </Button>
        <TableContainer>
          <Table>
            <TableCaption>Obras</TableCaption>
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
              {client.buildingSites.map((bs) => (
                <Tr key={bs.id}>
                  <Td>
                    <Link to={`/building-sites/${bs.id}`}>{bs.id}</Link>
                  </Td>
                  <Td>{bs.name}</Td>
                  <Td>{bs.address}</Td>
                  <Td>
                    <Link to={`/building-sites/${bs.id}`}>Ver detalhes</Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Container>
      {show && (
        <BuildingSiteModal client={client} onClose={() => setShow(false)} />
      )}
    </>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
