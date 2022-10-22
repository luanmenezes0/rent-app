import type { Delivery, DeliveryUnit } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getDeliveries() {
  return prisma.delivery.findMany({
    include: { buildingSite: true, units: { include: { rentable: true } } },
    orderBy: { createdAt: "desc" },
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
  units: Pick<
    DeliveryUnit,
    "count" | "rentableId" | "deliveryType" | "buildingSiteId"
  >[],
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

export async function getRentableCount(
  buildingSiteId: number,
  rentableId: number
) {
  const count = await prisma.deliveryUnit.aggregate({
    where: {
      buildingSiteId: Number(buildingSiteId),
      rentableId: Number(rentableId),
    },
    _sum: {
      count: true,
    },
  });

  return { rentableId, count: count._sum.count };
}

export async function getBuildingSiteInventory(buildingSiteId: string) {
  const rentables = await prisma.deliveryUnit.groupBy({
    where: { buildingSiteId: Number(buildingSiteId) },
    by: ["rentableId"],
  });

  const queries = rentables.map((r) =>
    getRentableCount(Number(buildingSiteId), r.rentableId)
  );

  return Promise.all(queries);
}

export async function getInventory(rentableId: number) {
  return prisma.deliveryUnit.aggregate({
    where: {
      rentableId: Number(rentableId),
    },
    _sum: {
      count: true,
    },
  });
}
