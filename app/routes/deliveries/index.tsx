import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link, useFetcher, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { GrDeliver, GrPrint } from "react-icons/gr";

import Header from "~/components/Header";
import { deleteDelivery, getDeliveries } from "~/models/delivery.server";
import { requireUserId } from "~/session.server";
import { groupBy } from "~/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const url = new URL(request.url);
  const skip = Number(url.searchParams.get("skip")) || 0;
  const take = 20; // Load 20 deliveries at a time

  const { deliveries, totalCount, hasMore } = await getDeliveries({
    take,
    skip,
  });

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

  return {
    deliveries: deliveriesGroupedByDate,
    totalCount,
    hasMore,
    currentSkip: skip,
    take,
  };
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
  const {
    deliveries: initialDeliveries,
    totalCount,
    hasMore: initialHasMore,
  } = useLoaderData<typeof loader>();

  const [allDeliveries, setAllDeliveries] = useState(initialDeliveries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const fetcher = useFetcher<typeof loader>();

  const cardColor = useColorModeValue("gray.100", "gray.700");
  const iconBgColor = useColorModeValue("gray.200", "gray.600");

  const handleLoadMore = () => {
    const nextSkip = allDeliveries.reduce(
      (total, [, data]) => total + data.length,
      0,
    );
    fetcher.load(`/deliveries?skip=${nextSkip}`);
  };

  // Update state when fetcher returns new data
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const newDeliveries = fetcher.data.deliveries;

      // Merge new deliveries with existing ones
      const mergedDeliveries = [...allDeliveries];

      newDeliveries.forEach(([date, data]) => {
        const existingDateIndex = mergedDeliveries.findIndex(
          ([existingDate]) => existingDate === date,
        );

        if (existingDateIndex >= 0) {
          // Merge with existing date group
          mergedDeliveries[existingDateIndex][1] = [
            ...mergedDeliveries[existingDateIndex][1],
            ...data,
          ];
        } else {
          // Add new date group
          mergedDeliveries.push([date, data]);
        }
      });

      // Sort by date (most recent first)
      mergedDeliveries.sort(([a], [b]) =>
        dayjs(a).isBefore(dayjs(b)) ? 1 : -1,
      );

      setAllDeliveries(mergedDeliveries);
      setHasMore(fetcher.data.hasMore);
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading as="h1" size="2xl">
              Remessas
            </Heading>
            <Text fontSize="sm" color="gray.600">
              {totalCount} remessas no total
            </Text>
          </HStack>

          {allDeliveries.map(([date, data]) => (
            <VStack key={date} align="stretch" gap="2">
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

                  <IconButton
                    variant={"outline"}
                    size={"sm"}
                    aria-label={"Imprimir"}
                    icon={<GrPrint />}
                    name="_action"
                    value="print-pdf"
                    as="a"
                    target="_blank"
                    href={`/print-pdf?deliveryId=${d.id}`}
                  />
                </Flex>
              ))}
            </VStack>
          ))}

          {hasMore && (
            <Flex justify="center" pt={6}>
              <Button
                onClick={handleLoadMore}
                isLoading={fetcher.state === "loading"}
                loadingText="Carregando..."
                colorScheme="blue"
                variant="outline"
                size="lg"
              >
                Carregar Mais
              </Button>
            </Flex>
          )}

          {!hasMore && allDeliveries.length > 0 && (
            <Text textAlign="center" color="gray.500" pt={4}>
              Todas as remessas foram carregadas
            </Text>
          )}
        </VStack>
      </Container>
    </>
  );
}
