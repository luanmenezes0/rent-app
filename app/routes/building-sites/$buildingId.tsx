import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useCatch, useLoaderData, useTransition } from "@remix-run/react";
import dayjs from "dayjs";
import { Button, Label, Modal, Select, Timeline } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiOutlineArrowDown, HiOutlineArrowUp } from "react-icons/hi";
import invariant from "tiny-invariant";
import Header from "~/components/Header";
import { getBuildingSite } from "~/models/buildingSite.server";
import { getClient } from "~/models/client.server";
import {
  createDelivery,
  getDeliveriesByBuildingId,
} from "~/models/delivery.server";
import { requireUserId } from "~/session.server";

export enum Rentables {
  "Andaime" = 1,
  "Escora",
  "Betoneira",
  "Rompedor",
}

export async function loader({ request, params }: LoaderArgs) {
  await requireUserId(request);

  invariant(params.buildingId, "buldingId not found");

  const buildingSite = await getBuildingSite(params.buildingId);

  if (!buildingSite) {
    throw new Response("Not Found", { status: 404 });
  }

  const deliveries = await getDeliveriesByBuildingId(params.buildingId);

  const client = await getClient(buildingSite.clientId);

  return json({ buildingSite, deliveries, client });
}

export async function action({ request }: ActionArgs) {
  await requireUserId(request);

  const formData = await request.formData();

  const {
    buildingSiteId,
    propsCount,
    propsDeliveryType,
    scaffoldingCount,
    scaffoldingDeliveryType,
    scaffolding,
  } = Object.fromEntries(formData);

  await createDelivery(
    {
      buildingSiteId: Number(buildingSiteId),
      propsCount: Number(propsCount),
      propsDeliveryType: Number(propsDeliveryType),
      scaffoldingCount: Number(scaffoldingCount),
      scaffoldingDeliveryType: Number(scaffoldingDeliveryType),
    },
    Number(scaffolding)
  );

  return null;
}

function DeliveyModal({
  onClose,
  buildingSiteId,
  scaffolding,
}: {
  onClose: () => void;
  buildingSiteId: number;
  scaffolding: number;
}) {
  return (
    <Modal show onClose={onClose} size="md">
      <Modal.Header>Nova Remessa</Modal.Header>
      <Modal.Body>
        <Form
          method="post"
          id="buiding-site-form"
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="buildingSiteId" value={buildingSiteId} />
          <input type="hidden" name="scaffolding" value={scaffolding} />
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="scaffoldingCount" value="Andaimes" />
            <input
              min={0}
              type="number"
              name="scaffoldingCount"
              id="scaffoldingCount"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              placeholder=""
              defaultValue={0}
              required
            />
            <Select name="scaffoldingDeliveryType">
              <option value="1">Entrega</option>
              <option value="2">Retirada</option>
            </Select>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor="propsCount" value="Escoras" />
            <input
              min={0}
              type="number"
              name="propsCount"
              id="propsCount"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              placeholder=""
              defaultValue={0}
              required
            />
            <Select name="propsDeliveryType">
              <option value="1">Entrega</option>
              <option value="2">Retirada</option>
            </Select>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="buiding-site-form"
          name="_action"
          value="create"
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
  const { buildingSite, deliveries, client } = useLoaderData<typeof loader>();

  const transition = useTransition();

  const [show, setShow] = useState(false);

  const isAdding = transition.state === "submitting";

  useEffect(() => {
    if (!isAdding) {
      setShow(false);
    }
  }, [isAdding]);

  return (
    <>
      <Header />
      <main className="h-full p-8">
        <h2 className="text-2xl font-bold">{buildingSite.name}</h2>
        <div className="flex justify-between">
          <div>
            <p>{client?.name}</p>
            <p className="py-4">{buildingSite.address}</p>
            <p>{buildingSite.scaffoldingCount} Andaimes</p>
            <p>{buildingSite.propsCount} Escoras</p>
            <div></div>
            <Button onClick={() => setShow(true)}>Adicionar Remessa</Button>
          </div>
          <div className="px-8 py-4">
            <h3 className="text-black-400 p-4 text-left text-xl font-bold">
              Remessas
            </h3>

            <Timeline>
              {deliveries.map((d) => (
                <Timeline.Item key={d.id}>
                  <Timeline.Point color="red" />
                  <Timeline.Content>
                    <Timeline.Time>
                      {dayjs(d.createdAt).format("DD/MM/YYYY HH:mm")}
                    </Timeline.Time>
                    {/* <Timeline.Title>{d.buildingSiteId}</Timeline.Title> */}
                    <Timeline.Body>
                      <div className="flex items-center gap-2">
                        Andaimes: {d.scaffoldingCount}{" "}
                        {d.scaffoldingDeliveryType === 1 ? (
                          <HiOutlineArrowUp color="green" />
                        ) : (
                          <HiOutlineArrowDown color="red" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        Escoras: {d.propsCount}{" "}
                        {d.propsDeliveryType === 1 ? (
                          <HiOutlineArrowUp color="green" />
                        ) : (
                          <HiOutlineArrowDown color="red" />
                        )}
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
          scaffolding={buildingSite.scaffoldingCount}
          onClose={() => setShow(false)}
          buildingSiteId={buildingSite.id}
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
    return <div>Cliente não encontrado</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
