import {
  Box,
  Container,
  HStack,
  Heading,
  Text,
  VStack,
  Wrap,
  useColorModeValue,
} from "@chakra-ui/react";
import type { LoaderFunctionArgs, SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

import Header from "~/components/Header";
import type { Rentable } from "~/models/inventory.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return json({ rentables });
}

function Card({ rentable }: { rentable: SerializeFrom<Rentable> }) {
  const { load, data } = useFetcher<{ inventory: number | null }>();

  useEffect(() => {
    load(`/rentablesinventory/?id=${rentable.id}`);
  }, [load, rentable.id]);

  const totalRented = data?.inventory ?? 0;

  const color = useColorModeValue("green.300", "green.600");

  return (
    <VStack
      borderRadius="4"
      as="article"
      minW="200"
      bgColor={color}
      p="4"
      flexGrow={{ base: 1, md: "0" }}
    >
      <Heading as="h2" size="md">
        {rentable.name}
      </Heading>
      <HStack justify="space-between" w="100%">
        <Text fontWeight="600">Alugado</Text>
        <div>{totalRented}</div>
      </HStack>
      <HStack justify="space-between" w="100%">
        <Text fontWeight="600">Livre</Text>
        <div>{rentable.count - totalRented}</div>
      </HStack>
      <HStack justify="space-between" w="100%">
        <Text fontWeight="600">Total</Text>
        <div>{rentable.count}</div>
      </HStack>
      <Box h="20px" w="100%" bgColor="black">
        <Box
          h="100%"
          w={`${(totalRented / rentable.count) * 100}%`}
          bgColor="orange.500"
        />
      </Box>
    </VStack>
  );
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="10">
        <Heading as="h1" size="2xl">
          Dashboard
        </Heading>
        <Wrap spacing={8}>
          {rentables.map((item) => (
            <Card key={item.id} rentable={item} />
          ))}
        </Wrap>
      </Container>
    </>
  );
}
