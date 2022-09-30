import type { Client } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Post } from "@prisma/client";

export async function getClients() {
  return prisma.client.findMany();
}

export async function getClient(id: string) {
  return prisma.client.findUnique({ where: { id } });
}

export async function createClient(client: Pick<Client, "address" | "name">) {
  return prisma.client.create({ data: client });
}

export async function editClient(
  client: Pick<Client, "address" | "name" | "id">
) {
  return prisma.client.update({ data: client, where: { id: client.id } });
}

export async function deleteClient(id: number) {
  return prisma.client.delete({ where: { id } });
}
