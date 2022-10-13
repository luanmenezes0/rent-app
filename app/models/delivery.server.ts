import type { Delivery } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getDeliveries() {
  return prisma.delivery.findMany({
    include: { buildingSite: true, rentable: true },
  });
}

export async function getDeliveriesByBuildingId(buildingSiteId: string) {
  return prisma.delivery.findMany({
    where: { buildingSiteId: Number(buildingSiteId) },
  });
}

export async function getDelivery(id: string) {
  return prisma.delivery.findUnique({ where: { id: Number(id) } });
}

type DeliveryUnit = {
  rentableId: FormDataEntryValue;
  count: string;
  deliveryType: string;
};

export async function createDeliveries(
  deliveries: DeliveryUnit[],
  buildingSiteId: string
) {
  deliveries.forEach(async (delivery) => {
    const rentableId = Number(delivery.rentableId);
    const count = Number(delivery.count);
    const deliveryType = Number(delivery.deliveryType);

    if (count > 0) {
      await prisma.delivery.create({
        data: {
          buildingSiteId: Number(buildingSiteId),
          rentableId,
          count,
          deliveryType,
        },
      });
    }
  });
}

export async function editDelivery(delivery: Delivery) {
  return prisma.delivery.update({
    data: delivery,
    where: { id: delivery.id },
  });
}

export async function deleteDelivery(id: string) {
  return prisma.delivery.delete({ where: { id: Number(id) } });
}

export enum DeliveryType {
  IN = 1,
  OUT = 2,
}
