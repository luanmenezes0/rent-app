import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stat,
  StatArrow,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useCatch,
  useFetcher,
  useLoaderData,
  useTransition,
  Link as RemixLink,
} from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
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
  getBuildingSiteInventory,
} from "~/models/delivery.server";
import type { Rentable } from "~/models/inventory.server.";
import { getRentables } from "~/models/inventory.server.";
import { requireUserId } from "~/session.server";
import { buildingSiteValidator } from "~/validators/buildingSiteValidator";

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
    }

    case "create-delivery": {
      const rentableIds = formData.getAll("rentableId") as string[];
      const buildingSiteId = formData.get("buildingSiteId") as string;

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

      await createDeliveries(units, buildingSiteId);

      return null;
    }

    default:
      throw new Error("Invalid action");
  }
}
interface DeliveryModalProps {
  onClose: () => void;
  buildingSiteId: number;
}

function DeliveyModal({ onClose, buildingSiteId }: DeliveryModalProps) {
  const fetcher = useFetcher<{ rentables: Rentable[] }>();

  const actionData = useActionData();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load("/inventory");
    }
  }, [fetcher]);

  return (
    <Modal size="md" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nova Remessa</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method="post" id="delivery-form">
            <VStack>
              <input
                type="hidden"
                name="buildingSiteId"
                value={buildingSiteId}
              />
              {actionData?.fieldErrors?.count && (
                <Alert status="error" borderRadius="16">
                  <AlertIcon />
                  <AlertDescription>
                    {actionData?.fieldErrors?.count}
                  </AlertDescription>
                </Alert>
              )}
              {fetcher.data?.rentables.map((rentable) => (
                <FormControl
                  display="grid"
                  gridTemplateColumns="repeat(3, 1fr)"
                  gap={4}
                  key={rentable.id}
                >
                  <input type="hidden" name="rentableId" value={rentable.id} />
                  <FormLabel
                    htmlFor={`${rentable.id}_count`}
                    alignSelf="center"
                  >
                    {rentable.name}
                  </FormLabel>
                  <Input
                    min={0}
                    type="number"
                    name={`${rentable.id}_count`}
                    id={`${rentable.id}_count`}
                    placeholder=""
                    defaultValue={0}
                    required
                  />
                  <Select name={`${rentable.id}_delivery_type`}>
                    <option value="1">Entrega</option>
                    <option value="2">Retirada</option>
                  </Select>
                </FormControl>
              ))}
            </VStack>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="outline" mx={2}>
            Cancelar
          </Button>
          <Button
            name="_action"
            value="create-delivery"
            type="submit"
            form="delivery-form"
          >
            Criar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function BuildingSite() {
  const { buildingSite, inventory, rentables } = useLoaderData<typeof loader>();

  const transition = useTransition();
  const actionData = useActionData();

  const [show, setShow] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  const isAdding = transition.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setShow(false);
      setShowBuildingModal(false);
    }
  }, [isAdding, actionData]);

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
            <Button variant="outline" onClick={() => setShow(true)}>
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
            <Stat key={d.id} p="6" border="1px" borderRadius="16">
              <StatLabel>
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
            </Stat>
          ))}
        </VStack>
      </Container>
      {show && (
        <DeliveyModal
          onClose={() => setShow(false)}
          buildingSiteId={buildingSite.id}
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
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Obra não encontrada</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
