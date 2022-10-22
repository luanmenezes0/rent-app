import type { BuildingSite } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getBuildingSites() {
  return prisma.buildingSite.findMany();
}

export async function getBuildingSitesByClientId(clientId: string) {
  return prisma.buildingSite.findMany({
    where: { clientId: Number(clientId) },
  });
}

export async function getBuildingSite(id: string) {
  return prisma.buildingSite.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      deliveries: {
        include: {
          units: {
            include: {
              rentable: true,
            },
          },
        },
      },
      inventories: true,
    },
  });
}

export async function createBuildingSite(
  buildingSite: Pick<BuildingSite, "address" | "name" | "clientId">
) {
  return prisma.buildingSite.create({ data: buildingSite });
}

export async function editBuildingSite(
  buildingSite: Pick<BuildingSite, "address" | "name" | "id">
) {
  return prisma.buildingSite.update({
    data: buildingSite,
    where: { id: buildingSite.id },
  });
}

export async function deleteBuildingSite(id: string) {
  return prisma.buildingSite.delete({ where: { id: Number(id) } });
}

export function groupBy<K, V>(
  list: Array<V>,
  keyGetter: (input: V) => K
): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

export async function getBuildingSiteInventory(buildingSiteId: string) {
  const deliveryUnits = await prisma.delivery.findMany({
    where: { buildingSiteId: Number(buildingSiteId) },
    select: {
      units: { select: { deliveryType: true, count: true, rentableId: true } },
    },
  });

  const mp = deliveryUnits.map((d) => d.units).flat();

  const gb = groupBy(mp, (x) => x.rentableId);
  console.log(Object.fromEntries(gb));
  return Object.fromEntries(gb);
}
