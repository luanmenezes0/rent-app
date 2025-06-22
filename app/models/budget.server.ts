import type { Budget, BudgetItem } from "@prisma/client";
import { prisma } from "~/db.server";

export type { Budget, BudgetItem };

export async function getBudgets() {
  return prisma.budget.findMany({
    include: {
      client: true,
      buildingSite: true,
      items: {
        include: {
          rentable: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBudget(id: string) {
  return prisma.budget.findUnique({
    where: { id: Number(id) },
    include: {
      client: {
        include: {
          buildingSites: true,
        },
      },
      buildingSite: true,
      items: {
        include: {
          rentable: true,
        },
      },
    },
  });
}

export async function createBudget(data: {
  clientId: number;
  buildingSiteId: number;
  validityDate: Date;
  deliveryFee: number;
  notes?: string;
  items: Array<{
    rentableId: number;
    quantity: number;
    startDate: Date;
    endDate: Date;
    unitPrice: number;
    discount?: number;
  }>;
}) {
  const items = data.items.map((item) => {
    const days = Math.ceil(
      (item.endDate.getTime() - item.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const subtotal = item.quantity * days * item.unitPrice;
    const discount = item.discount || 0;
    const total = subtotal - discount;

    return {
      rentableId: item.rentableId,
      quantity: item.quantity,
      startDate: item.startDate,
      endDate: item.endDate,
      days,
      unitPrice: item.unitPrice,
      discount,
      subtotal,
      total,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const total = subtotal - totalDiscount + data.deliveryFee;

  return prisma.budget.create({
    data: {
      clientId: data.clientId,
      buildingSiteId: data.buildingSiteId,
      validityDate: data.validityDate,
      deliveryFee: data.deliveryFee,
      notes: data.notes,
      subtotal,
      totalDiscount,
      total,
      items: {
        create: items,
      },
    },
    include: {
      client: true,
      buildingSite: true,
      items: {
        include: {
          rentable: true,
        },
      },
    },
  });
}

export async function updateBudget(
  id: string,
  data: {
    status?: string;
    validityDate?: Date;
    deliveryFee?: number;
    notes?: string;
    items?: Array<{
      id?: number;
      rentableId: number;
      quantity: number;
      startDate: Date;
      endDate: Date;
      unitPrice: number;
      discount?: number;
    }>;
  },
) {
  const budget = await prisma.budget.findUnique({
    where: { id: Number(id) },
    include: { items: true },
  });

  if (!budget) {
    throw new Error("Budget not found");
  }

  if (budget.status === "APPROVED") {
    throw new Error("Cannot update an approved budget");
  }

  if (data.items) {
    // Delete existing items
    await prisma.budgetItem.deleteMany({
      where: { budgetId: Number(id) },
    });

    // Create new items
    const items = data.items.map((item) => {
      const days = Math.ceil(
        (item.endDate.getTime() - item.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const subtotal = item.quantity * days * item.unitPrice;
      const discount = item.discount || 0;
      const total = subtotal - discount;

      return {
        rentableId: item.rentableId,
        quantity: item.quantity,
        startDate: item.startDate,
        endDate: item.endDate,
        days,
        unitPrice: item.unitPrice,
        discount,
        subtotal,
        total,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const total =
      subtotal - totalDiscount + (data.deliveryFee || budget.deliveryFee);

    return prisma.budget.update({
      where: { id: Number(id) },
      data: {
        status: data.status,
        validityDate: data.validityDate,
        deliveryFee: data.deliveryFee,
        notes: data.notes,
        subtotal,
        totalDiscount,
        total,
        items: {
          create: items,
        },
      },
      include: {
        client: true,
        buildingSite: true,
        items: {
          include: {
            rentable: true,
          },
        },
      },
    });
  }

  // If no items update, just update the budget fields
  return prisma.budget.update({
    where: { id: Number(id) },
    data: {
      status: data.status,
      validityDate: data.validityDate,
      deliveryFee: data.deliveryFee,
      notes: data.notes,
    },
    include: {
      client: true,
      buildingSite: true,
      items: {
        include: {
          rentable: true,
        },
      },
    },
  });
}

export async function deleteBudget(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: Number(id) },
  });

  if (!budget) {
    throw new Error("Budget not found");
  }

  if (budget.status === "APPROVED") {
    throw new Error("Cannot delete an approved budget");
  }

  return prisma.budget.delete({
    where: { id: Number(id) },
  });
}

export async function approveBudget(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: Number(id) },
    include: {
      items: {
        include: {
          rentable: true,
        },
      },
    },
  });

  if (!budget) {
    throw new Error("Budget not found");
  }

  if (budget.status === "APPROVED") {
    throw new Error("Budget is already approved");
  }

  // Create delivery from budget
  const delivery = await prisma.delivery.create({
    data: {
      buildingSiteId: budget.buildingSiteId,
      date: new Date(),
      units: {
        create: budget.items.map((item) => ({
          count: item.quantity,
          deliveryType: 1, // Regular delivery
          rentableId: item.rentableId,
          buildingSiteId: budget.buildingSiteId,
        })),
      },
    },
  });

  // Update budget with delivery reference and status
  return prisma.budget.update({
    where: { id: Number(id) },
    data: {
      status: "APPROVED",
      deliveryId: delivery.id,
    },
    include: {
      client: true,
      buildingSite: true,
      items: {
        include: {
          rentable: true,
        },
      },
    },
  });
}
