import { Container, Heading, VStack, Wrap } from "@chakra-ui/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";
import { RadialChart } from "react-vis";
import Header from "~/components/Header";
import type { Rentable } from "~/models/inventory.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);

  const rentables = await getRentables();

  return json({ rentables });
}

function Card({
  rentable,
}: {
  rentable: Omit<Rentable, "createdAt" | "updatedAt">;
}) {
  const fetcher = useFetcher<{ inventory: number | null }>();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load(`/rentablesinventory/?id=${rentable.id}`);
    }
  }, [fetcher, rentable.id]);

  const totalRented = fetcher.data?.inventory ?? 0;

  const a = totalRented / rentable.count;
  const b = (rentable.count - totalRented) / rentable.count;

  return (
    <VStack as="article" minW="200">
      <Heading as="h2" size="md">
        {rentable.name}
      </Heading>
      <div>ALUGADO: {totalRented}</div>
      <div>TOTAL: {rentable.count}</div>
      <RadialChart
        showLabels
        data={[
          { angle: a, label: "Alugado" },
          { angle: b, label: "Em estoque" },
        ]}
        width={200}
        height={200}
        labelsStyle={{ fontSize: 11 }}
      />
    </VStack>
  );
}

export default function Index() {
  const { rentables } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="20">
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
