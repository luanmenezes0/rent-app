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
import dayjs from "dayjs";
import { Button, Label, Modal, Select, Timeline } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiOutlineArrowDown, HiOutlineArrowUp } from "react-icons/hi";
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
    <Modal show onClose={onClose} size="md">
      <Modal.Header>Nova Remessa</Modal.Header>
      <Modal.Body>
        <Form method="post" id="delivery-form" className="flex flex-col gap-4">
          <input type="hidden" name="buildingSiteId" value={buildingSiteId} />
          {fetcher.data?.rentables.map((rentable) => (
            <div key={rentable.id}>
              <input type="hidden" name="rentableId" value={rentable.id} />
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor={`${rentable.id}_count`} value={rentable.name} />
                <input
                  min={0}
                  type="number"
                  name={`${rentable.id}_count`}
                  id={`${rentable.id}_count`}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder=""
                  defaultValue={0}
                  required
                />
                <Select name={`${rentable.id}_delivery_type`}>
                  <option value="1">Entrega</option>
                  <option value="2">Retirada</option>
                </Select>
              </div>
            </div>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          name="_action"
          value="create-delivery"
          type="submit"
          form="delivery-form"
        >
          Criar
        </Button>
        <Button onClick={onClose} color="gray">
          Cancelar
        </Button>
      </Modal.Footer>
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
      <main className="h-full p-8">
        <h2 className="text-2xl font-bold">{buildingSite.name}</h2>
        <div className="flex justify-between">
          <div>
            <dl>
              <dt className="font-bold">Endereço</dt>
              <dd>{buildingSite.address}</dd>

              <dt className="font-bold">Cliente</dt>
              <dd>{buildingSite.client.name}</dd>
            </dl>
            <Button onClick={() => setShow(true)}>Adicionar Remessa</Button>
            <Button onClick={() => setShowBuildingModal(true)}>
              Editar Obra
            </Button>
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

            <Timeline>
              {buildingSite.deliveries.map((d) => (
                <Timeline.Item key={d.id}>
                  <Timeline.Point color="red" />
                  <Timeline.Content>
                    <Timeline.Time>
                      {dayjs(d.createdAt).format("DD/MM/YYYY HH:mm")}
                    </Timeline.Time>
                    {/* <Timeline.Title>{d.buildingSiteId}</Timeline.Title> */}
                    <Timeline.Body>
                      <div className="flex items-center gap-2">
                        {d.units.map((u) => (
                          <p
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
                          </p>
                        ))}
                      </div>
                    </Timeline.Body>
                  </Timeline.Content>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </div>
      </main>
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
