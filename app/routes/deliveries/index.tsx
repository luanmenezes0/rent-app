import {
  Container,
  Heading,
  Link,
  Stat,
  StatArrow,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { json } from "@remix-run/node";
import { Link as RemixLink, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import Header from "~/components/Header";
import { getDeliveries } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  return json({ deliveries: await getDeliveries() });
}

export default function Deliveries() {
  const { deliveries } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="xl">
          Remessas
        </Heading>

        {deliveries.map((d) => (
          <Stat key={d.id} p="6" border="1px" borderRadius="16">
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
            <Link as={RemixLink} to={`/building-sites/${d.buildingSiteId}`}>
              Ver Obra
            </Link>
          </Stat>
        ))}
      </Container>
    </>
  );
}
