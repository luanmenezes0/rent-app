import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  NumberInput,
  NumberInputField,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import type { Client, Rentable } from "@prisma/client";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useLoaderData, useNavigation } from "react-router";

import Header from "~/components/Header";
import {
  approveBudget,
  deleteBudget,
  getBudget,
  updateBudget,
} from "~/models/budget.server";
import { getClients } from "~/models/client.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";
import { parseZodError, unflattenObject, validationError } from "~/utils";
import { BudgetSchema } from "~/validators/budgetValidator";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);

  if (!params.budgetId) {
    throw new Error("Budget ID is required");
  }

  const [budget, clients, rentables] = await Promise.all([
    getBudget(params.budgetId),
    getClients({}),
    getRentables(),
  ]);

  if (!budget) {
    throw new Error("Budget not found");
  }

  return { budget, clients: clients.data, rentables };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);

  if (!params.budgetId) {
    throw new Error("Budget ID is required");
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "approve") {
    await approveBudget(params.budgetId);
    return null;
  }

  if (action === "delete") {
    await deleteBudget(params.budgetId);
    return redirect("/budgets");
  }

  const data = Object.fromEntries(formData.entries());
  const processedObject = unflattenObject(data, "items");
  const result = BudgetSchema.safeParse(processedObject);

  if (!result.success) {
    return validationError(parseZodError(result.error));
  }

  const { validityDate, deliveryFee, notes, items } = result.data;

  await updateBudget(params.budgetId, {
    validityDate: new Date(validityDate),
    deliveryFee: Number(deliveryFee),
    notes,
    items: items.map((item) => {
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate);
      return {
        rentableId: Number(item.rentableId),
        quantity: Number(item.quantity),
        startDate,
        endDate,
        unitPrice: Number(item.unitPrice),
        discount: item.discount ? Number(item.discount) : undefined,
      };
    }),
  });

  return null;
}

type BudgetItem = {
  id: string;
  rentableId: string;
  quantity: string;
  startDate: string;
  endDate: string;
  discount?: string;
};

// type BudgetWithRelations = Budget & {
//   client: Client & {
//     buildingSites: Array<{ id: number; name: string }>;
//   };
//   items: Array<{
//     id: number;
//     rentableId: number;
//     quantity: number;
//     startDate: Date;
//     endDate: Date;
//     discount: number;
//   }>;
// };

export default function BudgetDetail() {
  const { budget, clients, rentables } = useLoaderData<typeof loader>();
  // const actionData = useActionData<{ fieldErrors: Record<string, string> }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedClient, setSelectedClient] = useState<string>(
    budget.clientId.toString(),
  );
  const [buildingSites, setBuildingSites] = useState<
    Array<{ id: number; name: string }>
  >(budget.client.buildingSites);
  const [items, setItems] = useState<BudgetItem[]>(
    budget.items.map((item) => ({
      id: Math.random().toString(),
      rentableId: item.rentableId.toString(),
      quantity: item.quantity.toString(),
      startDate: dayjs(item.startDate).format("YYYY-MM-DD"),
      endDate: dayjs(item.endDate).format("YYYY-MM-DD"),
      discount: item.discount ? (item.discount / 100).toString() : undefined,
    })),
  );

  useEffect(() => {
    if (selectedClient) {
      const client = clients.find((c) => c.id.toString() === selectedClient);
      if (client && client.buildingSites) {
        setBuildingSites(client.buildingSites);
      }
    } else {
      setBuildingSites([]);
    }
  }, [selectedClient, clients]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        rentableId: "",
        quantity: "1",
        startDate: dayjs().format("YYYY-MM-DD"),
        endDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="10">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            Orçamento #{budget.id}
          </Heading>
          <Badge colorScheme={budget.status === "APPROVED" ? "green" : "gray"}>
            {budget.status}
          </Badge>
        </HStack>

        <Form method="post">
          <VStack spacing={8} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={8}>
              <FormControl isRequired>
                <FormLabel>Cliente</FormLabel>
                <Select
                  name="clientId"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  isDisabled={budget.status === "APPROVED"}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client: Client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Canteiro</FormLabel>
                <Select
                  name="buildingSiteId"
                  defaultValue={budget.buildingSiteId}
                  isDisabled={budget.status === "APPROVED"}
                >
                  <option value="">Selecione um canteiro</option>
                  {buildingSites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Data de Validade</FormLabel>
                <Input
                  type="date"
                  name="validityDate"
                  min={dayjs().format("YYYY-MM-DD")}
                  defaultValue={dayjs(budget.validityDate).format("YYYY-MM-DD")}
                  isDisabled={budget.status === "APPROVED"}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Taxa de Entrega</FormLabel>
                <InputGroup>
                  <InputLeftAddon>R$</InputLeftAddon>
                  <Input
                    type="number"
                    name="deliveryFee"
                    defaultValue={(budget.deliveryFee / 100).toString()}
                    min="0"
                    step="0.01"
                    isDisabled={budget.status === "APPROVED"}
                  />
                </InputGroup>
              </FormControl>
            </Grid>

            <Box>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Itens</Heading>
                {budget.status !== "APPROVED" && (
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={addItem}
                    colorScheme="blue"
                  >
                    Adicionar Item
                  </Button>
                )}
              </HStack>

              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Item</Th>
                      <Th>Quantidade</Th>
                      <Th>Data Início</Th>
                      <Th>Data Término</Th>
                      <Th>Desconto</Th>
                      <Th>Subtotal</Th>
                      <Th>Total</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.map((item: BudgetItem) => {
                      const rentable = rentables.find(
                        (r) => r.id.toString() === item.rentableId,
                      );
                      const days = dayjs(item.endDate).diff(
                        dayjs(item.startDate),
                        "day",
                      );
                      const subtotal =
                        rentable && item.quantity
                          ? Number(item.quantity) * days * rentable.unitPrice
                          : 0;
                      const discount = item.discount
                        ? Number(item.discount) * 100
                        : 0;
                      const total = subtotal - discount;

                      return (
                        <Tr key={item.id}>
                          <Td>
                            <Select
                              name={`items[${item.id}].rentableId`}
                              value={item.rentableId}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "rentableId",
                                  e.target.value,
                                )
                              }
                              isDisabled={budget.status === "APPROVED"}
                            >
                              <option value="">Selecione um item</option>
                              {rentables.map((rentable: Rentable) => (
                                <option key={rentable.id} value={rentable.id}>
                                  {rentable.name}
                                </option>
                              ))}
                            </Select>
                          </Td>
                          <Td>
                            <NumberInput
                              min={1}
                              value={item.quantity}
                              onChange={(value) =>
                                updateItem(item.id, "quantity", value)
                              }
                              isDisabled={budget.status === "APPROVED"}
                            >
                              <NumberInputField
                                name={`items[${item.id}].quantity`}
                              />
                            </NumberInput>
                          </Td>
                          <Td>
                            <Input
                              type="date"
                              name={`items[${item.id}].startDate`}
                              value={item.startDate}
                              onChange={(e) =>
                                updateItem(item.id, "startDate", e.target.value)
                              }
                              isDisabled={budget.status === "APPROVED"}
                            />
                          </Td>
                          <Td>
                            <Input
                              type="date"
                              name={`items[${item.id}].endDate`}
                              value={item.endDate}
                              onChange={(e) =>
                                updateItem(item.id, "endDate", e.target.value)
                              }
                              isDisabled={budget.status === "APPROVED"}
                            />
                          </Td>
                          <Td>
                            <InputGroup>
                              <InputLeftAddon>R$</InputLeftAddon>
                              <Input
                                type="number"
                                name={`items[${item.id}].discount`}
                                value={item.discount || ""}
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "discount",
                                    e.target.value,
                                  )
                                }
                                min="0"
                                step="0.01"
                                isDisabled={budget.status === "APPROVED"}
                              />
                            </InputGroup>
                          </Td>
                          <Td>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(subtotal / 100)}
                          </Td>
                          <Td>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(total / 100)}
                          </Td>
                          <Td>
                            {budget.status !== "APPROVED" && (
                              <IconButton
                                aria-label="Remover item"
                                icon={<DeleteIcon />}
                                onClick={() => removeItem(item.id)}
                                colorScheme="red"
                                variant="ghost"
                              />
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>

            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Total:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(budget.total / 100)}
              </Text>

              <HStack spacing={4}>
                {budget.status === "DRAFT" && (
                  <>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      isLoading={isSubmitting}
                      loadingText="Salvando..."
                    >
                      Salvar Alterações
                    </Button>
                    <Button
                      type="submit"
                      name="_action"
                      value="approve"
                      colorScheme="green"
                      isLoading={isSubmitting}
                      loadingText="Aprovando..."
                    >
                      Aprovar Orçamento
                    </Button>
                    <Button
                      type="submit"
                      name="_action"
                      value="delete"
                      colorScheme="red"
                      variant="outline"
                      isLoading={isSubmitting}
                      loadingText="Excluindo..."
                      onClick={(e) => {
                        if (
                          !confirm(
                            "Tem certeza que deseja excluir este orçamento?",
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Excluir Orçamento
                    </Button>
                  </>
                )}
              </HStack>
            </HStack>
          </VStack>
        </Form>
      </Container>
    </>
  );
}
