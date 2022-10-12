import type { Rentable } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getRentables() {
  return prisma.rentable.findMany();
}

export async function createRentable(rentable: Pick<Rentable, "name">) {
  return prisma.rentable.create({ data: rentable });
}

export async function editRentable(
  rentable: Pick<Rentable, "name" | "id" | "count">
) {
  return prisma.rentable.update({ data: rentable, where: { id: rentable.id } });
}