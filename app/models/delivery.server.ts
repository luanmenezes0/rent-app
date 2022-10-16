import type { Delivery, DeliveryUnit } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getDeliveries() {
  return prisma.delivery.findMany({
    include: { buildingSite: true, units: { include: { rentable: true } } },
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

export async function createDeliveries(
  units: Pick<DeliveryUnit, "count" | "rentableId" | "deliveryType">[],
  buildingSiteId: string
) {
  await prisma.delivery.create({
    data: {
      buildingSiteId: Number(buildingSiteId),
      units: { create: units },
    },
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
