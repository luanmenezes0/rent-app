import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await prisma.delivery.create({
    data: {
      propsCount: 8,
      propsDeliveryType: 1,
      scaffoldingDeliveryType: 1,
      buildingSiteId: 1,
      scaffoldingCount: 16,
    },
  });

  await prisma.rentable.create({
    data: {
      name: "Andaime",
      count: 615,
    },
  });

  // const clients = await prisma.client.findMany({});

  // const deleteClient = async (client: Client) => {
  //   return await prisma.client.delete({
  //     where: { id: client.id },
  //   });
  // };

  // const deleteClients = async () => {
  //   clients.map((user) => deleteClient(user));
  // };

  // deleteClients();

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
