import { Container, Heading, Table, VisuallyHidden } from "@chakra-ui/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import BuildingSiteStatusLabel from "~/components/BuildingSiteStatusLabel";
import Header from "~/components/Header";
import { PaginationBar } from "~/components/PaginationBar";
import { getBuildingSites } from "~/models/buildingSite.server";
import { requireUserId } from "~/session.server";
import { PAGINATION_LIMIT } from "~/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const top = Number(url.searchParams.get("$top")) || PAGINATION_LIMIT;
  const skip = Number(url.searchParams.get("$skip")) || 0;
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") || "active";

  const { data, count } = await getBuildingSites({
    top,
    skip,
    search,
    status,
  });

  return json({ buildingSites: data, count });
}

export async function action({ request }: ActionFunctionArgs) {
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
        <>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Id</Table.ColumnHeader>
                <Table.ColumnHeader>Nome</Table.ColumnHeader>
                <Table.ColumnHeader>Endereço</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>
                  <VisuallyHidden>Ações</VisuallyHidden>
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {buildingSites.map((bs) => (
                <Table.Row key={bs.id}>
                  <Table.Cell>{bs.id}</Table.Cell>
                  <Table.Cell>{bs.name}</Table.Cell>
                  <Table.Cell>{bs.address.slice(0, 46)}</Table.Cell>
                  <Table.Cell>
                    <BuildingSiteStatusLabel status={bs.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/building-sites/${bs.id}`}>Ver detalhes</Link>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </>
        <PaginationBar total={count} />
      </Container>
    </>
  );
}
