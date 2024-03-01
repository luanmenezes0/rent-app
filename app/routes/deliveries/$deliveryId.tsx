import {
  Container,
  Heading,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import invariant from "tiny-invariant";

import { getDelivery } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);

  invariant(params.deliveryId, "buldingId not found");

  const delivery = await getDelivery(params.deliveryId);

  if (!delivery) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ delivery });
}

export default function Index() {
  const { delivery } = useLoaderData<typeof loader>();

  return (
    <Container fontSize="14px">
      <VStack gap={8} paddingTop={10} align="start">
        <VStack alignSelf="center">
          <Heading fontSize="20">Ordem de Entrega</Heading>
          <p>Naldo Locações</p>
        </VStack>

        <VStack align="start" gap={0}>
          <div>Nome: {delivery.buildingSite.client.name}</div>
          <div>Endereço da Obra: {delivery.buildingSite.address}</div>
          <div>Telefone: {delivery.buildingSite.client.phoneNumber}</div>
          <div>Data: {dayjs(delivery.date).format("DD/MM/YYYY")}</div>
        </VStack>

        <Table size="sm" colorScheme="black" variant="striped">
          <Thead>
            <Tr>
              <Th>Código</Th>
              <Th>Item</Th>
              <Th>Quantidade</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {delivery.units.map((unit) => (
              <Tr key={unit.id}>
                <Td>{unit.id}</Td>
                <Td>{unit.rentable.name}</Td>
                <Td>{Math.abs(unit.count)}</Td>
                <Td>{unit.deliveryType === 1 ? "Entrega" : "Devolução"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {/* <pre>{JSON.stringify(delivery, null, 2)}</pre> */}

        <p>Assinatura do cliente: _____________________________________</p>
        <footer>
          <span>Naldo Locações - </span>
          <span> Rua 121, 122, Planalto Caucaia - </span>
          <span>Telefone: 85 33427462</span>
        </footer>
      </VStack>
    </Container>
  );
}
