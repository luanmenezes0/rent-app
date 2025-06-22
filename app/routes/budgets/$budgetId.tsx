import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
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
  useToast,
  VStack,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import Header from "~/components/Header";
import {
  approveBudget,
  deleteBudget,
  getBudget,
  updateBudget,
} from "~/models/budget.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";
import { parseZodError, unflattenObject, validationError } from "~/utils";
import { BudgetSchema } from "~/validators/budgetValidator";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);

  if (!params.budgetId) {
    throw new Error("Budget ID is required");
  }

  const [budget, rentables] = await Promise.all([
    getBudget(params.budgetId),
    getRentables(),
  ]);

  if (!budget) {
    throw new Error("Budget not found");
  }

  return { budget, rentables };
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
    const budget = await getBudget(params.budgetId);
    await deleteBudget(params.budgetId);
    return redirect(`/clients/${budget?.clientId}`);
  }

  const data = Object.fromEntries(formData.entries());
  const processedObject = unflattenObject(data, "items");
  const result = BudgetSchema.safeParse(processedObject);

  if (!result.success) {
    return validationError(parseZodError(result.error));
  }

  const { validityDate, deliveryFee, notes, items } = result.data;

  const rentables = await getRentables();

  await updateBudget(params.budgetId, {
    validityDate: new Date(validityDate),
    deliveryFee: Math.round(Number(deliveryFee) * 100),
    notes,
    items: items.map((item) => {
      const startDate = new Date(validityDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Number(item.days));

      const rentable = rentables.find((r) => r.id === Number(item.rentableId));
      return {
        rentableId: Number(item.rentableId),
        quantity: Number(item.quantity),
        startDate,
        endDate,
        unitPrice: rentable?.unitPrice || 0,
        discount: item.discount
          ? Math.round(Number(item.discount) * 100)
          : undefined,
      };
    }),
  });

  return null;
}

type BudgetItem = {
  id: string;
  rentableId: string;
  quantity: string;
  days: string;
  unitPrice: number;
  discount?: string;
};

export default function BudgetDetail() {
  const { budget, rentables } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ fieldErrors: Record<string, string> }>();
  const navigation = useNavigation();
  const toast = useToast();
  const isSubmitting = navigation.state === "submitting";

  const [items, setItems] = useState<BudgetItem[]>(
    budget.items.map((item) => {
      const days = Math.ceil(
        (new Date(item.endDate).getTime() -
          new Date(item.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        id: Math.random().toString(),
        rentableId: item.rentableId.toString(),
        quantity: item.quantity.toString(),
        days: days.toString(),
        unitPrice: item.unitPrice,
        discount: item.discount ? (item.discount / 100).toString() : undefined,
      };
    }),
  );

  useEffect(() => {
    if (actionData?.fieldErrors) {
      Object.entries(actionData.fieldErrors).forEach(([, error]) => {
        toast({
          title: "Erro de validação",
          description: error,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
    }
  }, [actionData, toast]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        rentableId: "",
        quantity: "1",
        days: "1",
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: string) => {
    if (field === "rentableId") {
      const rentable = rentables.find(
        (rentable) => rentable.id === Number(value),
      );
      setItems(
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                [field]: value,
                unitPrice: rentable?.unitPrice || 0,
              }
            : item,
        ),
      );
      return;
    }

    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
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
          <Text fontSize="lg">Cliente: {budget.client?.name}</Text>
          <Badge colorScheme={budget.status === "APPROVED" ? "green" : "gray"}>
            {budget.status}
          </Badge>
        </HStack>

        <Form method="post">
          <VStack spacing={8} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={8}>
              <FormControl isRequired>
                <FormLabel>Canteiro</FormLabel>
                <Select
                  name="buildingSiteId"
                  defaultValue={budget.buildingSiteId}
                  isDisabled={budget.status === "APPROVED"}
                >
                  <option value="">Selecione um canteiro</option>

                  <option
                    key={budget.buildingSite.id}
                    value={budget.buildingSite.id}
                  >
                    {budget.buildingSite.name}
                  </option>
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
                      <Th w={"200px"}>Item</Th>
                      <Th>Quantidade</Th>
                      <Th>Dias</Th>
                      <Th>Preço Unitário (dia)</Th>
                      <Th>Desconto</Th>
                      <Th>Subtotal</Th>
                      <Th>Total</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.map((item) => {
                      const rentable = rentables.find(
                        (r) => r.id === Number(item.rentableId),
                      );
                      const subtotal =
                        rentable && item.quantity && item.days
                          ? Number(item.quantity) *
                            Number(item.days) *
                            rentable.unitPrice
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
                              {rentables.map((rentable) => (
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
                            <NumberInput
                              min={1}
                              value={item.days}
                              onChange={(value) =>
                                updateItem(item.id, "days", value)
                              }
                              isDisabled={budget.status === "APPROVED"}
                            >
                              <NumberInputField
                                name={`items[${item.id}].days`}
                              />
                            </NumberInput>
                          </Td>
                          <Td>
                            <InputGroup>
                              <InputLeftAddon>R$</InputLeftAddon>
                              <Input
                                type="number"
                                name={`items[${item.id}].unitPrice`}
                                value={
                                  item.unitPrice
                                    ? (item.unitPrice / 100).toFixed(2)
                                    : ""
                                }
                                min="0"
                                step="0.01"
                                readOnly
                              />
                            </InputGroup>
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
            {actionData?.fieldErrors.items && items.length === 0 && (
              <Alert status="error">
                <AlertIcon />
                Adicione pelo menos um item ao orçamento.
              </Alert>
            )}

            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Total:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(
                  items.reduce((sum, item) => {
                    const rentable = rentables.find(
                      (r) => r.id === Number(item.rentableId),
                    );
                    const subtotal =
                      rentable && item.quantity && item.days
                        ? Number(item.quantity) *
                          Number(item.days) *
                          rentable.unitPrice
                        : 0;
                    const discount = item.discount
                      ? Number(item.discount) * 100
                      : 0;
                    return sum + (subtotal - discount);
                  }, 0) / 100,
                )}
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
                {budget.status === "APPROVED" && (
                  <>
                    <Button
                      as="a"
                      href={`/budgets/${budget.id}/print`}
                      target="_blank"
                      colorScheme="blue"
                      variant="ghost"
                    >
                      Visualizar Impressão
                    </Button>
                    <Button
                      as="a"
                      href={`/print-pdf?budgetId=${budget.id}`}
                      target="_blank"
                      colorScheme="blue"
                      variant="outline"
                    >
                      Imprimir PDF
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
