import {
  Container,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VisuallyHidden
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import BuildingSiteStatusLabel from "~/components/BuildingSiteStatusLabel";

import Header from "~/components/Header";
import { PaginationBar } from "~/components/PaginationBar";
import { getBuildingSites } from "~/models/buildingSite.server";
import { requireUserId } from "~/session.server";
import {
  PAGINATION_LIMIT
} from "~/utils";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const top = Number(url.searchParams.get("$top")) || PAGINATION_LIMIT;
  const skip = Number(url.searchParams.get("$skip")) || 0;
  const search = url.searchParams.get("search") ?? undefined;

  const { data, count } = await getBuildingSites({
    top,
    skip,
    search,
  });

  return json({ buildingSites: data, count });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  return null;
}



export default function BuildingSites() {
  const { buildingSites, count } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Obras
        </Heading>
        <TableContainer>
          <Table>
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
              {buildingSites.map((bs) => (
                <Tr key={bs.id}>
                  <Td>{bs.id}</Td>
                  <Td>{bs.name}</Td>
                  <Td>{bs.address.slice(0, 46)}</Td>
                  <Td>
                    <BuildingSiteStatusLabel status={bs.status} />
                  </Td>
                  <Td>
                    <Link to={`/building-sites/${bs.id}`}>Ver detalhes</Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
        <PaginationBar total={count} />
      </Container>
    </>
  );
}
