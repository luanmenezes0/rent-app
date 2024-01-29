import type { Client } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getClients({
  search,
  top,
  skip,
}: {
  search?: string;
  skip?: number;
  top?: number;
}) {
  const [count, data] = await Promise.all([
    prisma.client.count({
      where: {
        name: {
          contains: search,
        },
      },
    }),
    prisma.client.findMany({
      skip,
      take: top,
      where: {
        name: {
          contains: search,
        },
      },
    }),
  ]);

  return { count, data };
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id: Number(id) },
    include: { buildingSites: true },
  });
}

export async function createClient(
  client: Omit<Client, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.client.create({ data: client });
}

export async function editClient(
  client: Omit<Client, "createdAt" | "updatedAt">,
) {
  return prisma.client.update({ data: client, where: { id: client.id } });
}

export async function deleteClient(id: string) {
  return prisma.client.delete({ where: { id: Number(id) } });
}
