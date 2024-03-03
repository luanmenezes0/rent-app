import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";
export type { User } from "@prisma/client";

export async function getUsers() {
  return prisma.user.findMany();
}

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User["email"], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function editUser(id: string, role: string) {
  return prisma.user.update({
    where: { id },
    data: { role },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  userPassword: Password["hash"],
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    userPassword,
    userWithPassword.password.hash,
  );

  if (!isValid) {
    return null;
  }

  const { password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export const SERVER_SECRET = "946684799000";

export async function verifyToken(token: string) {
  return bcrypt.compare(SERVER_SECRET, token);
}
