import {
  Button,
  Container,
  Divider,
  HStack,
  Heading,
  Link,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link as RemixLink,
  useActionData,
  useFetchers,
  useLoaderData,
} from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";

import BuildingSiteModal from "~/components/BuildingSiteModal";
import BuildingSiteStatusLabel from "~/components/BuildingSiteStatusLabel";
import DeliveryCard from "~/components/DeliveryCard";
import Header from "~/components/Header";
import {
  editBuildingSite,
  getBuildingSite,
} from "~/models/buildingSite.server";
import {
  createDeliveries,
  deleteDelivery,
  editDelivery,
  getBuildingSiteInventory,
} from "~/models/delivery.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";
import { buildingSiteValidator } from "~/validators/buildingSiteValidator";

import { DeliveyModal } from "../../components/DeliveyModal";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);

  invariant(params.buildingId, "buldingId not found");

  const buildingSite = await getBuildingSite(params.buildingId);

  if (!buildingSite) {
    throw new Response("Not Found", { status: 404 });
  }

  const inventory = await getBuildingSiteInventory(params.buildingId);

  const rentables = await getRentables();

  return json({ buildingSite, inventory, rentables });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "edit-bs": {
      const result = await buildingSiteValidator.validate(formData);

      if (result.error) {
        return validationError(result.error);
      }

      await editBuildingSite({
        address: result.data.address,
        name: result.data.name,
        id: Number(result.data.id),
        status: Number(result.data.status ?? 1),
      });

      return null;
    }

    case "create-delivery": {
      const rentableIds = formData.getAll("rentableId") as string[];
      const buildingSiteId = formData.get("buildingSiteId") as string;
      const date = formData.get("date") as string;

      const units = rentableIds
        .map((id) => {
          const count = formData.get(`${id}_count`) as string;
          const deliveryType = formData.get(`${id}_delivery_type`) as string;

          return {
            rentableId: Number(id),
            count: Number(deliveryType) === 1 ? Number(count) : -Number(count),
            deliveryType: Number(deliveryType),
            buildingSiteId: Number(buildingSiteId),
          };
        })
        .filter((u) => u.count !== 0);

      if (!units.length) {
        return validationError({
          fieldErrors: {
            count: "É necessário informar a quantidade de pelo menos um item",
          },
        });
      }

      await createDeliveries(units, buildingSiteId, dayjs(date).toDate());

      return null;
    }

    case "edit-delivery": {
      const rentableIds = formData.getAll("rentableId") as string[];
      const buildingSiteId = formData.get("buildingSiteId") as string;
      const date = formData.get("date") as string;
      const id = formData.get("id") as string;

      const units = rentableIds
        .map((id) => {
          const count = formData.get(`${id}_count`) as string;
          const deliveryType = formData.get(`${id}_delivery_type`) as string;

          return {
            id: Number(id),
            count: Number(deliveryType) === 1 ? Number(count) : -Number(count),
            deliveryType: Number(deliveryType),
            buildingSiteId: Number(buildingSiteId),
          };
        })
        .filter((u) => u.count !== 0);

      if (!units.length) {
        return validationError({
          fieldErrors: {
            count: "É necessário informar a quantidade de pelo menos um item",
          },
        });
      }

      await editDelivery(
        {
          buildingSiteId: Number(buildingSiteId),
          id: Number(id),
          date: new Date(date),
        },
        units,
      );

      return null;
    }

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

export default function BuildingSite() {
  const { buildingSite, inventory, rentables } = useLoaderData<typeof loader>();

  const fetcher = useFetchers();
  const actionData = useActionData<{ fieldErrors: Record<string, string> }>();

  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  const isAdding = fetcher.some((f) => f.state === "submitting");

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      onClose();
      setShowBuildingModal(false);
    }
  }, [isAdding, actionData, onClose]);

  const cardColor = useColorModeValue("gray.100", "gray.700");

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <VStack>
          <Text>Detalhes da Obra</Text>
          <Heading as="h1" size="xl">
            {buildingSite.name}
          </Heading>
          <HStack py={6}>
            <Button variant="outline" onClick={onOpen}>
              Adicionar Remessa
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBuildingModal(true)}
            >
              Editar Obra
            </Button>
          </HStack>
        </VStack>

        <VStack as="dl" align="flex-start">
          <div>
            <Text fontWeight="bold" as="dt">
              Endereço
            </Text>
            <dd>{buildingSite.address}</dd>
          </div>

          <div>
            <Text fontWeight="bold" as="dt">
              Cliente
            </Text>
            <Link to={`/clients/${buildingSite.client.id}`} as={RemixLink}>
              <dd>{buildingSite.client.name}</dd>
            </Link>
          </div>
          <BuildingSiteStatusLabel status={buildingSite.status} />
        </VStack>
        <Divider />
        <VStack align="stretch" as="section">
          <Heading
            as="h2"
            size="lg"
            color={useColorModeValue("green.600", "green.100")}
          >
            Materiais
          </Heading>
          <HStack>
            {inventory.map((rentable) => (
              <Stat
                key={rentable.rentableId}
                bgColor={cardColor}
                padding="4"
                borderRadius="16"
              >
                <StatLabel>
                  {rentables.find((i) => i.id === rentable.rentableId)?.name}
                </StatLabel>
                <StatNumber>{rentable.count}</StatNumber>
              </Stat>
            ))}
          </HStack>
        </VStack>
        <Divider />
        <VStack align="stretch" as="section">
          <Heading
            as="h2"
            size="lg"
            color={useColorModeValue("green.600", "green.100")}
          >
            Remessas
          </Heading>
          {buildingSite.deliveries.map((d) => (
            <DeliveryCard key={d.id} delivery={d} rentables={rentables} />
          ))}
        </VStack>
      </Container>
      {/* delivery creation */}
      {isOpen ? (
        <DeliveyModal
          onClose={onClose}
          buildingSiteId={buildingSite.id}
          rentables={rentables}
        />
      ) : null}
      {showBuildingModal ? (
        <BuildingSiteModal
          editionMode
          client={buildingSite.client}
          values={buildingSite}
          onClose={() => setShowBuildingModal(false)}
        />
      ) : null}
    </>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
