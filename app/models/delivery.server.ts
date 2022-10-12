import type { Delivery } from "@prisma/client";
import { prisma } from "~/db.server";
import { updateCount } from "./buildingSite.server";

export async function getDeliveries() {
  return prisma.delivery.findMany();
}

export async function getDeliveriesByBuildingId(buildingSiteId: string) {
  return prisma.delivery.findMany({
    where: { buildingSiteId: Number(buildingSiteId) },
  });
}

export async function getDelivery(id: string) {
  return prisma.delivery.findUnique({ where: { id: Number(id) } });
}

export async function createDelivery(
  delivery: Omit<Delivery, "id" | "createdAt" | "updatedAt">,
  scaffolding: number
) {
  await prisma.delivery.create({
    data: delivery,
  });

  let scaffoldingCount = scaffolding;

  if (delivery.scaffoldingCount && delivery.scaffoldingDeliveryType === 1) {
    scaffoldingCount = scaffoldingCount + delivery.scaffoldingCount;
  }

  if (delivery.scaffoldingCount && delivery.scaffoldingDeliveryType === 2) {
    scaffoldingCount = scaffoldingCount - delivery.scaffoldingCount;
  }

  return updateCount({
    buildingSiteId: delivery.buildingSiteId,
    scaffoldingCount: scaffoldingCount,
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
