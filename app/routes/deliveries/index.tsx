import { DeleteIcon } from "@chakra-ui/icons";
import {
  Button,
  Container,
  Flex,
  Heading,
  Link,
  Stat,
  StatArrow,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { json } from "@remix-run/node";
import { Form, Link as RemixLink, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import Header from "~/components/Header";
import { deleteDelivery, getDeliveries } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, context }: LoaderArgs) {
  const userId = await requireUserId(request);

  return json({ deliveries: await getDeliveries(), userId });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "delete-delivery": {
      const id = formData.get("id");

      if (typeof id === "string") {
        await deleteDelivery(id);
      }

      return null;
    }

    default:
      throw new Error("Invalid action");
  }
}

export default function Deliveries() {
  const { deliveries, userId } = useLoaderData<typeof loader>();

  console.log(userId);

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Remessas
        </Heading>

        {deliveries.map((d) => (
          <Stat key={d.id} p="4" border="1px" borderRadius="8">
            <StatLabel>
              {d.buildingSite.name} -{" "}
              {dayjs(d.createdAt).format("DD/MM/YYYY HH:mm")}
            </StatLabel>
            {d.units.map((u) => (
              <StatNumber key={u.id}>
                {u.rentable.name} - {Math.abs(u.count)}{" "}
                <StatArrow
                  type={u.deliveryType === 1 ? "increase" : "decrease"}
                />
              </StatNumber>
            ))}
            <Flex justify="space-between" align="center">
              <Link as={RemixLink} to={`/building-sites/${d.buildingSiteId}`}>
                Ver Obra
              </Link>
              <Form method="POST">
                <input type="hidden" name="id" value={d.id} />
                <Button
                  colorScheme="red"
                  type="submit"
                  variant="ghost"
                  name="_action"
                  value="delete-delivery"
                  aria-label="Excluir remessa"
                  leftIcon={<DeleteIcon />}
                />
              </Form>
            </Flex>
          </Stat>
        ))}
      </Container>
    </>
  );
}
