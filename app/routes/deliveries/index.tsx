import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import dayjs from "dayjs";
import { GrDeliver, GrPrint } from "react-icons/gr";

import Header from "~/components/Header";
import { deleteDelivery, getDeliveries } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";
import { groupBy } from "~/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const deliveries = await getDeliveries();

  const deliveriesGroupedByDate = Object.entries(
    groupBy(
      deliveries.map((d) => ({
        ...d,
        date: dayjs(d.date).tz("America/Fortaleza").format("DD/MM/YYYY HH:mm"),
        day: dayjs(d.date).tz("America/Fortaleza").startOf("day"),
      })),
      (d) => d.day,
    ),
  ).sort(([a], [b]) => (dayjs(a).isBefore(dayjs(b)) ? 1 : -1));

  console.log(deliveriesGroupedByDate[0]);

  return json({ deliveries: deliveriesGroupedByDate });
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

  const cardColor = useColorModeValue("gray.100", "gray.700");
  const iconBgColor = useColorModeValue("gray.200", "gray.600");

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Remessas
        </Heading>
        {deliveries.map(([date, data]) => (
          <VStack key={date} align="strech" gap="2">
            <Heading as="h2" size="md">
              {dayjs(date).tz("America/Fortaleza").format("DD/MM/YYYY")}
            </Heading>
            {data.map((d) => (
              <Flex
                bgColor={cardColor}
                gap={4}
                key={d.id}
                p="4"
                borderRadius="8"
                flexDirection={{ base: "column", md: "row" }}
              >
                <Flex
                  justify="center"
                  align="center"
                  borderRadius="8"
                  display={{ base: "none", md: "flex" }}
                  p="2"
                  bgColor={iconBgColor}
                  h="min-content"
                >
                  <Icon color="gray.500" w={8} h={8} as={GrDeliver} />
                </Flex>
                <Box justifySelf="start" flexGrow={1}>
                  <HStack pb="2" fontSize="14">
                    <Heading as="h3" fontSize="14">
                      {d.date}
                    </Heading>
                    {d.buildingSite ? (
                      <Link to={`/building-sites/${d.buildingSite.id}`}>
                        - {d.buildingSite.name}
                      </Link>
                    ) : null}
                  </HStack>

                  {d.units.map((u) => (
                    <Flex align="center" gap="2" borderRadius="8" key={u.id}>
                      {u.deliveryType === 1 ? (
                        <TriangleUpIcon color="green" />
                      ) : (
                        <TriangleDownIcon color="red" />
                      )}
                      {u.rentable.name} - {Math.abs(u.count)}{" "}
                    </Flex>
                  ))}
                </Box>
                <div>
                  <IconButton
                    variant={"outline"}
                    size={"sm"}
                    aria-label={"Imprimir"}
                    icon={<GrPrint />}
                    as="a"
                    target="_blank"
                    href={`/print-pdf?deliveryId=${d.id}`}
                  />
                </div>
              </Flex>
            ))}
          </VStack>
        ))}
      </Container>
    </>
  );
}
