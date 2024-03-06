import { Box, Flex, Heading, VStack } from "@chakra-ui/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import invariant from "tiny-invariant";

import { getDelivery } from "~/models/delivery.server";

import styles from "../../components/styles.module.css";

export async function loader({ params }: LoaderFunctionArgs) {
  // await requireUserId(request);

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
    <Box mx="100px" my="50px">
      <VStack gap={8} paddingTop={10} align="start">
        <VStack alignSelf="center">
          <Heading fontSize="20">Ordem de Entrega</Heading>
          <p>Naldo Locações</p>
        </VStack>

        <VStack align="start" gap={0}>
          <div>
            <b>Nome:</b> {delivery.buildingSite.client.name}
          </div>
          <div>
            <b>Endereço da Obra:</b> {delivery.buildingSite.address}
          </div>
          <div>
            <b>Telefone:</b> {delivery.buildingSite.client.phoneNumber}
          </div>
          <div>
            <b>Data:</b> {dayjs(delivery.date).format("DD/MM/YYYY")}
          </div>
        </VStack>

        <div className={styles.container}>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {delivery.units.map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.id}</td>
                  <td>{unit.rentable.name}</td>
                  <td>{Math.abs(unit.count)}</td>
                  <td>{unit.deliveryType === 1 ? "Entrega" : "Devolução"}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Flex justifyContent="space-between" pt={2}>
            <div>Não vale como recibo</div>
            <Flex alignItems="center" gap={1}>
              <b>Valor Total:</b>

              <div className={styles.box}>
                <div>R$</div>
              </div>
            </Flex>
          </Flex>
        </div>

        <p>Assinatura: _______________________________________________</p>
        <Box alignSelf="center">
          <footer>
            <span>Naldo Locações - </span>
            <span> Rua 121, 122, Planalto Caucaia - </span>
            <span>Telefone: (85) 9 96439851</span>
          </footer>
        </Box>
      </VStack>
    </Box>
  );
}
