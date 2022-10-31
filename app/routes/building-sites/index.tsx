import {
  Container,
  Heading,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import Header from "~/components/Header";
import { getBuildingSites } from "~/models/buildingSite.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json({ buildingSites: await getBuildingSites() });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  return null;
}

export default function BuildingSites() {
  const { buildingSites } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Obras
        </Heading>

        <Table>
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
            {buildingSites.map((bs) => (
              <Tr key={bs.id}>
                <Td>{bs.id}</Td>
                <Td>{bs.name}</Td>
                <Td>{bs.address}</Td>
                <Td>
                  <Link to={`/building-sites/${bs.id}`}>Ver detalhes</Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Container>
    </>
  );
}
