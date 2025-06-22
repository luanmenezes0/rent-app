import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  HStack,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import dayjs from "dayjs";

import Header from "~/components/Header";
import type { Budget } from "~/models/budget.server";
import { deleteBudget, getBudgets } from "~/models/budget.server";
import { requireUserId } from "~/session.server";
import { getBudgetStatusLabel, getBudgetStatusColor } from "~/utils/budgetStatus";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const budgets = await getBudgets();
  return { budgets };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);

  const formData = await request.formData();
  const budgetId = formData.get("budgetId");

  if (!budgetId || typeof budgetId !== "string") {
    throw new Error("Budget ID is required");
  }

  await deleteBudget(budgetId);
  return null;
}


type BudgetWithRelations = Budget & {
  client: { name: string };
  buildingSite: { name: string };
};

export default function Budgets() {
  const { budgets } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="10">
        <HStack justify="space-between">
          <Heading as="h1" size="2xl">
            Orçamentos
          </Heading>
          <Button as={Link} to="/budgets/new" leftIcon={<AddIcon />}>
            Novo Orçamento
          </Button>
        </HStack>

        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Cliente</Th>
                <Th>Canteiro</Th>
                <Th>Data de Validade</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {budgets.map((budget: BudgetWithRelations) => (
                <Tr key={budget.id}>
                  <Td>{budget.client.name}</Td>
                  <Td>{budget.buildingSite.name}</Td>
                  <Td>{dayjs(budget.validityDate).format("DD/MM/YYYY")}</Td>
                  <Td>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(budget.total / 100)}
                  </Td>
                  <Td>
                    <Badge colorScheme={getBudgetStatusColor(budget.status)}>
                      {getBudgetStatusLabel(budget.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        as={Link}
                        to={`/budgets/${budget.id}`}
                        aria-label="Editar orçamento"
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                      />
                      {budget.status === "DRAFT" && (
                        <Form method="post">
                          <input
                            type="hidden"
                            name="budgetId"
                            value={budget.id}
                          />
                          <IconButton
                            type="submit"
                            aria-label="Excluir orçamento"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={(e) => {
                              if (
                                !confirm(
                                  "Tem certeza que deseja excluir este orçamento?",
                                )
                              ) {
                                e.preventDefault();
                              }
                            }}
                          />
                        </Form>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
}
