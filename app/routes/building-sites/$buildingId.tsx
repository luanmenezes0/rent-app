import {
  DeleteIcon,
  EditIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  HStack,
  Heading,
  Icon,
  IconButton,
  Link,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link as RemixLink,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { GrDeliver } from "react-icons/gr";
import { validationError } from "remix-validated-form";
import invariant from "tiny-invariant";
import BuildingSiteModal from "~/components/BuildingSiteModal";
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
import { MyAlertDialog } from "~/components/AlertDialog";

export async function loader({ request, params }: LoaderArgs) {
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

export async function action({ request }: ActionArgs) {
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
          date: dayjs(date).toDate(),
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

const initialState = { show: false, editing: false, data: null };
type State = { show: boolean; editing: boolean; data: any };

export default function BuildingSite() {
  const { buildingSite, inventory, rentables } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const actionData = useActionData();

  const [deliveryModal, setDeliveryModal] = useState<State>(initialState);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetcher = useFetcher();

  function handleOpenDeleteModal(id: number) {
    setIdToDelete(id);
    onOpen();
  }

  function handleCloseDeleteModal() {
    setIdToDelete(null);
    onClose();
  }

  function handleDelete(id: number) {
    fetcher.submit({ id, _action: "delete-delivery" }, { method: "delete" });
    handleCloseDeleteModal();
  }

  const isAdding = navigation.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setDeliveryModal(initialState);
      setShowBuildingModal(false);
    }
  }, [isAdding, actionData]);

  const cardColor = useColorModeValue("gray.100", "gray.700");
  const iconBgColor = useColorModeValue("gray.200", "gray.600");

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
            <Button
              variant="outline"
              onClick={() => setDeliveryModal({ ...initialState, show: true })}
            >
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
            <Grid
              templateColumns="min-content 1fr min-content min-content"
              bgColor={cardColor}
              gap={2}
              key={d.id}
              p="4"
              borderRadius="8"
            >
              <Flex
                justify="center"
                align="center"
                borderRadius="8"
                p="2"
                bgColor={iconBgColor}
                h="min-content"
              >
                <Icon color="gray.500" w={8} h={8} as={GrDeliver} />
              </Flex>
              <Box justifySelf="start" paddingInline="4">
                <Heading as="h3" fontSize="14" pb="2">
                  {dayjs(d.date).format("DD/MM/YYYY HH:mm")}
                </Heading>
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
                variant="outline"
                size="sm"
                aria-label="Editar remessa"
                icon={<EditIcon />}
                onClick={() =>
                  setDeliveryModal({ show: true, editing: true, data: d })
                }
              />
              <IconButton
                variant="outline"
                size="sm"
                colorScheme="red"
                aria-label="Deletar remessa"
                icon={<DeleteIcon />}
                onClick={() => handleOpenDeleteModal(d.id)}
              />
            </Grid>
          ))}
        </VStack>
      </Container>
      {deliveryModal.show && (
        <DeliveyModal
          onClose={() => setDeliveryModal(initialState)}
          buildingSiteId={buildingSite.id}
          editionMode={deliveryModal.editing}
          rentables={rentables}
          values={deliveryModal.data}
        />
      )}
      {showBuildingModal && (
        <BuildingSiteModal
          editionMode
          client={buildingSite.client}
          values={buildingSite}
          onClose={() => setShowBuildingModal(false)}
        />
      )}
      {idToDelete && (
        <MyAlertDialog
          isOpen={isOpen}
          onClose={onClose}
          onDelete={() => handleDelete(idToDelete)}
          title="Deletar Remessa"
        />
      )}
    </>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
