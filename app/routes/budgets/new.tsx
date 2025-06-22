import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
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
import invariant from "tiny-invariant";

import Header from "~/components/Header";
import { createBudget } from "~/models/budget.server";
import { getBuildingSitesByClientId } from "~/models/buildingSite.server";
import { getClient } from "~/models/client.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";
import { parseZodError, unflattenObject, validationError } from "~/utils";
import { BudgetSchema } from "~/validators/budgetValidator";

type BudgetItem = {
  id: string;
  rentableId: string;
  quantity: string;
  days: string;
  unitPrice: number;
  discount?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  invariant(clientId, "clientId is required");
  const buildingSiteId = url.searchParams.get("buildingSiteId");

  const [client, buildingSites, rentables] = await Promise.all([
    getClient(clientId),
    getBuildingSitesByClientId(clientId),
    getRentables(),
  ]);

  return {
    client,
    buildingSites,
    rentables,
    preselectedClientId: clientId,
    preselectedBuildingSiteId: buildingSiteId,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const processedObject = unflattenObject(
    Object.fromEntries(formData.entries()),
    "items",
  );

  const result = BudgetSchema.safeParse(processedObject);

  if (!result.success) {
    return validationError(parseZodError(result.error));
  }

  const { clientId, buildingSiteId, validityDate, deliveryFee, notes, items } =
    result.data;

  const rentables = await getRentables();

  await createBudget({
    clientId: Number(clientId),
    buildingSiteId: Number(buildingSiteId),
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

  return redirect(`/clients/${clientId}`);
}

export default function NewBudget() {
  const {
    rentables,
    preselectedClientId,
    preselectedBuildingSiteId,
    buildingSites,
    client,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ fieldErrors: Record<string, string> }>();
  const navigation = useNavigation();
  const toast = useToast();
  const isSubmitting = navigation.state === "submitting";

  const [items, setItems] = useState<BudgetItem[]>([]);

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

  console.log(actionData);

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

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="10">
        <Heading as="h1" size="2xl">
          Novo Orçamento
        </Heading>
        <Text fontSize="lg">Cliente: {client?.name}</Text>

        <Form method="post">
          <VStack spacing={8} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={8}>
              <input
                type="hidden"
                name="clientId"
                value={preselectedClientId}
              />

              <FormControl isRequired>
                <FormLabel>Obra</FormLabel>
                <Select
                  name="buildingSiteId"
                  defaultValue={preselectedBuildingSiteId || ""}
                >
                  <option value="">Selecione uma obra</option>
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
                  defaultValue={dayjs().add(7, "day").format("YYYY-MM-DD")}
                  required
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Taxa de Entrega</FormLabel>
                <InputGroup>
                  <InputLeftAddon>R$</InputLeftAddon>
                  <Input
                    type="number"
                    name="deliveryFee"
                    defaultValue="0"
                    min="0"
                    step="0.01"
                  />
                </InputGroup>
              </FormControl>
            </Grid>

            <Box>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Itens</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  onClick={addItem}
                  variant="outline"
                >
                  Adicionar Item
                </Button>
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
                            >
                              <NumberInputField
                                name={`items[${item.id}].quantity`}
                              />
                            </NumberInput>
                          </Td>
                          <Td>
                            <NumberInput
                              min={1}
                              // w="fit-content"
                              value={item.days}
                              onChange={(value) =>
                                updateItem(item.id, "days", value)
                              }
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
                            <IconButton
                              aria-label="Remover item"
                              icon={<DeleteIcon />}
                              onClick={() => removeItem(item.id)}
                              colorScheme="red"
                              variant="ghost"
                            />
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
            </HStack>

            <HStack justify="flex-end" spacing={4}>
              <Button
                type="submit"
                variant="solid"
                isLoading={isSubmitting}
                loadingText="Salvando..."
              >
                Salvar Orçamento
              </Button>
            </HStack>
          </VStack>
        </Form>
      </Container>
    </>
  );
}
