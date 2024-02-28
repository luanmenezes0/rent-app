import { Container, Heading, VStack } from "@chakra-ui/react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";
import dayjs from "dayjs";

import DeliveryCard from "~/components/DeliveryCard";
import Header from "~/components/Header";
import { deleteDelivery, getDeliveries } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";
import { groupBy } from "~/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  return json({ deliveries: await getDeliveries() });
}

export async function action({ request }: ActionFunctionArgs) {
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
  const { deliveries } = useLoaderData<typeof loader>();

  const groupedBy = Object.entries(
    groupBy(
      deliveries.map((d) => ({ ...d, day: dayjs(d.date).startOf("day") })),
      (d) => d.day,
    ),
  ).sort(([a], [b]) => (dayjs(a).isBefore(dayjs(b)) ? 1 : -1));

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Remessas
        </Heading>
        {groupedBy.map(([date, data]) => (
          <VStack key={date} align="strech" gap="2">
            <Heading as="h2" size="md">
              {dayjs(date).format("DD/MM/YYYY")}
            </Heading>
            {data.map((d) => (
              <DeliveryCard delivery={d} key={d.id} hideActions />
            ))}
          </VStack>
        ))}
      </Container>
    </>
  );
}
