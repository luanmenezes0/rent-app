import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  Select,
  Text,
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
} from "@remix-run/react";
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

  return json({ buildingSite, inventory });
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
              {fetcher.data?.rentables.map((rentable) => (
                <FormControl
                  display="grid"
                  gridTemplateColumns="repeat(3, 1fr)"
                  gap={4}
                  key={rentable.id}
                >
                  <input type="hidden" name="rentableId" value={rentable.id} />
                  <FormLabel htmlFor={`${rentable.id}_count`}>
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
  const { buildingSite, inventory } = useLoaderData<typeof loader>();

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
            <dd>{buildingSite.client.name}</dd>
          </div>
        </VStack>

        <div className="flex justify-between">
          <div>
            {inventory.map((rentable) => (
              <div key={rentable.rentableId}>
                <h3>{rentable.rentableId}</h3>
                <div>{rentable.count}</div>
              </div>
            ))}
          </div>
          <div className="px-8 py-4">
            <h3 className="text-black-400 p-4 text-left text-xl font-bold">
              Remessas
            </h3>

            {/*   <Timeline>
              {buildingSite.deliveries.map((d) => (
                <Timeline.Item key={d.id}>
                  <Timeline.Point color="red" />
                  <Timeline.Content>
                    <Timeline.Time>
                      {dayjs(d.createdAt).format("DD/MM/YYYY HH:mm")}
                    </Timeline.Time>
                    <Timeline.Body>
                      <div className="flex items-center gap-2">
                        {d.units.map((u) => (
                          <div
                            key={u.id}
                            className="font-normal text-gray-700 dark:text-gray-400"
                          >
                            <div className="flex items-center gap-2">
                              {u.rentable.name} - {u.count}
                              {u.deliveryType === 1 ? (
                                <HiOutlineArrowUp color="green" />
                              ) : (
                                <HiOutlineArrowDown color="red" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Timeline.Body>
                  </Timeline.Content>
                </Timeline.Item>
              ))}
            </Timeline> */}
          </div>
        </div>
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
