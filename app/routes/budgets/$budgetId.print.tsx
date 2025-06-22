import {
  Box,
  Container,
  Divider,
  Grid,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import dayjs from "dayjs";
import invariant from "tiny-invariant";

import { getBudget } from "~/models/budget.server";
import { requireUserId } from "~/session.server";
import { getBudgetStatusLabel } from "~/utils/budgetStatus";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  invariant(params.budgetId, "budgetId not found");

  const budget = await getBudget(params.budgetId);

  if (!budget) {
    throw new Response("Not Found", { status: 404 });
  }

  return { budget };
}

export default function BudgetPrint() {
  const { budget } = useLoaderData<typeof loader>();

  const printStyles = `
    @media print {
      @page {
        margin: 1cm;
        size: A4;
      }

    }

    body {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
      background: white !important;
      color: black !important;
    }
    * {
      background: transparent !important;
      color: black !important;
      box-shadow: none !important;
    }
    .print-header {
      color: #2563eb !important;
    }
    .print-subheader {
      color: #64748b !important;
    }
    .print-table-header {
      background: #f8fafc !important;
      color: #1e293b !important;
    }
    .print-total-section {
      background: #f8fafc !important;
      color: #1e293b !important;
    }
    @media screen {
      body {
        background: #f5f5f5;
        padding: 20px;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <Container
        maxW="210mm"
        minH="297mm"
        bg="white"
        p={8}
        boxShadow="0 0 10px rgba(0,0,0,0.1)"
        mx="auto"
      >
        {/* Header */}
        <VStack spacing={6} align="stretch" mb={8}>
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="md" className="print-header">
                Naldo Locações
              </Text>
              <Heading size="lg" className="print-header">
                ORÇAMENTO
              </Heading>
              <Text fontSize="lg" className="print-subheader">
                #{budget.id.toString().padStart(6, "0")}
              </Text>
            </VStack>
            <VStack align="end" spacing={1}>
              <Text fontWeight="bold" fontSize="sm" className="print-subheader">
                DATA DE EMISSÃO
              </Text>
              <Text fontSize="md">
                {dayjs(budget.createdAt).format("DD/MM/YYYY")}
              </Text>
              <Text fontWeight="bold" fontSize="sm" className="print-subheader" mt={2}>
                VALIDADE
              </Text>
              <Text fontSize="md">
                {dayjs(budget.validityDate).format("DD/MM/YYYY")}
              </Text>
            </VStack>
          </HStack>

          <Divider borderColor="gray.300" borderWidth="2px" />

          {/* Client and Building Site Info */}
          <Grid templateColumns="1fr 1fr" gap={8}>
            <Box>
              <Text fontWeight="bold" fontSize="sm" className="print-header" mb={2}>
                CLIENTE
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="lg">
                  {budget.client.name}
                </Text>
                <Text fontSize="sm" className="print-subheader">
                  {budget.client.address}
                </Text>
                <Text fontSize="sm" className="print-subheader">
                  {budget.client.neighborhood}, {budget.client.city} -{" "}
                  {budget.client.state}
                </Text>
                {budget.client.phoneNumber && (
                  <Text fontSize="sm" className="print-subheader">
                    Tel: {budget.client.phoneNumber}
                  </Text>
                )}
                {budget.client.registrationNumber && (
                  <Text fontSize="sm" className="print-subheader">
                    {budget.client.isLegalEntity ? "CNPJ" : "CPF"}:{" "}
                    {budget.client.registrationNumber}
                  </Text>
                )}
              </VStack>
            </Box>

            <Box>
              <Text fontWeight="bold" fontSize="sm" className="print-header" mb={2}>
                OBRA/CANTEIRO
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="lg">
                  {budget.buildingSite.name}
                </Text>
                <Text fontSize="sm" className="print-subheader">
                  {budget.buildingSite.address}
                </Text>
              </VStack>
            </Box>
          </Grid>
        </VStack>

        {/* Items Table */}
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="md" className="print-header">
            ITENS DO ORÇAMENTO
          </Text>

          <Table variant="simple" size="sm">
            <Thead className="print-table-header">
              <Tr>
                <Th fontSize="xs" py={3}>
                  ITEM
                </Th>
                <Th fontSize="xs" py={3} textAlign="center">
                  QTD
                </Th>
                <Th fontSize="xs" py={3} textAlign="center">
                  DIAS
                </Th>
                <Th fontSize="xs" py={3} textAlign="right">
                  PREÇO UNIT.
                </Th>
                <Th fontSize="xs" py={3} textAlign="right">
                  SUBTOTAL
                </Th>
                {budget.items.some((item) => item.discount > 0) && (
                  <Th fontSize="xs" py={3} textAlign="right">
                    DESCONTO
                  </Th>
                )}
                <Th fontSize="xs" py={3} textAlign="right">
                  TOTAL
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {budget.items.map((item) => {
                const subtotal = item.quantity * item.days * item.unitPrice;
                const total = subtotal - item.discount;

                return (
                  <Tr key={item.id} borderBottom="1px" borderColor="gray.100">
                    <Td fontSize="sm" py={3}>
                      {item.rentable.name}
                    </Td>
                    <Td fontSize="sm" py={3} textAlign="center">
                      {item.quantity}
                    </Td>
                    <Td fontSize="sm" py={3} textAlign="center">
                      {item.days}
                    </Td>
                    <Td fontSize="sm" py={3} textAlign="right">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.unitPrice / 100)}
                    </Td>
                    <Td fontSize="sm" py={3} textAlign="right">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(subtotal / 100)}
                    </Td>
                    {budget.items.some((item) => item.discount > 0) && (
                      <Td fontSize="sm" py={3} textAlign="right" color="red.600">
                        {item.discount > 0
                          ? `-${new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.discount / 100)}`
                          : "-"}
                      </Td>
                    )}
                    <Td fontSize="sm" py={3} textAlign="right" fontWeight="bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(total / 100)}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          {/* Summary */}
          <VStack align="end" spacing={2} mt={4}>
            <HStack w="300px" justify="space-between" borderTop="1px" borderColor="gray.200" pt={2}>
              <Text fontSize="sm">Subtotal dos itens:</Text>
              <Text fontSize="sm" fontWeight="bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(budget.subtotal / 100)}
              </Text>
            </HStack>

            {budget.totalDiscount > 0 && (
              <HStack w="300px" justify="space-between">
                <Text fontSize="sm" color="red.600">Total de descontos:</Text>
                <Text fontSize="sm" fontWeight="bold" color="red.600">
                  -{new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(budget.totalDiscount / 100)}
                </Text>
              </HStack>
            )}

            {budget.deliveryFee > 0 && (
              <HStack w="300px" justify="space-between">
                <Text fontSize="sm">Taxa de entrega:</Text>
                <Text fontSize="sm" fontWeight="bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(budget.deliveryFee / 100)}
                </Text>
              </HStack>
            )}

            <HStack
              w="300px"
              justify="space-between"
              className="print-total-section"
              px={4}
              py={3}
              borderRadius="md"
            >
              <Text fontSize="lg" fontWeight="bold">
                TOTAL GERAL:
              </Text>
              <Text fontSize="lg" fontWeight="bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(budget.total / 100)}
              </Text>
            </HStack>
          </VStack>

          {/* Notes */}
          {budget.notes && (
            <Box mt={6}>
              <Text fontWeight="bold" fontSize="sm" className="print-header" mb={2}>
                OBSERVAÇÕES
              </Text>
              <Text fontSize="sm" p={3} bg="gray.50" borderRadius="md">
                {budget.notes}
              </Text>
            </Box>
          )}

          {/* Footer */}
          <Box mt={8} pt={4} borderTop="1px" borderColor="gray.200">
            <VStack spacing={2}>
              <Text fontSize="xs" className="print-subheader" textAlign="center">
                Este orçamento é válido até {dayjs(budget.validityDate).format("DD/MM/YYYY")}
              </Text>
              <Text fontSize="xs" className="print-subheader" textAlign="center">
                Status: {getBudgetStatusLabel(budget.status)} - Atualizado em {dayjs(budget.updatedAt).format("DD/MM/YYYY")}
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
}