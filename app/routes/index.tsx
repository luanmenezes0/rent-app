import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useEffect } from "react";
import { FiActivity, FiPackage, FiTrendingUp, FiTruck } from "react-icons/fi";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";

import Header from "~/components/Header";
import { getBudgets } from "~/models/budget.server";
import { getClients } from "~/models/client.server";
import { getDeliveries } from "~/models/delivery.server";
import type { Rentable } from "~/models/inventory.server";
import { getRentables } from "~/models/inventory.server";
import { requireUserId } from "~/session.server";
import {
  getBudgetStatusColor,
  getBudgetStatusLabel,
} from "~/utils/budgetStatus";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const [rentables, budgets, clientsData, deliveriesData] = await Promise.all([
    getRentables(),
    getBudgets(),
    getClients({}),
    getDeliveries({ take: 100 }), // Get recent deliveries for analytics
  ]);

  // Calculate dashboard metrics
  const totalRevenue = budgets
    .filter((b) => b.status === "APPROVED")
    .reduce((sum, budget) => sum + budget.total, 0);

  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter((b) => b.status === "APPROVED").length;
  const expiredBudgets = budgets.filter(
    (b) => dayjs(b.validityDate).isBefore(dayjs()) && b.status !== "APPROVED",
  ).length;

  const totalClients = clientsData.count;

  // Recent budgets (last 7 days)
  const recentBudgets = budgets.filter((b) =>
    dayjs(b.createdAt).isAfter(dayjs().subtract(7, "day")),
  );

  // Monthly revenue for current year
  const monthlyRevenue = Array.from({ length: 12 }, (_, month) => {
    const monthRevenue = budgets
      .filter(
        (b) =>
          b.status === "APPROVED" &&
          dayjs(b.createdAt).month() === month &&
          dayjs(b.createdAt).year() === dayjs().year(),
      )
      .reduce((sum, budget) => sum + budget.total, 0);
    return monthRevenue;
  });

  // Delivery analytics
  const deliveries = deliveriesData.deliveries;
  const totalDeliveries = deliveries.length;
  const recentDeliveries = deliveries.filter((d) =>
    dayjs(d.createdAt).isAfter(dayjs().subtract(7, "day")),
  ).length;

  // Equipment activity (deliveries per month)
  const monthlyDeliveries = Array.from({ length: 12 }, (_, month) => {
    return deliveries.filter(
      (d) =>
        dayjs(d.createdAt).month() === month &&
        dayjs(d.createdAt).year() === dayjs().year(),
    ).length;
  });

  // Inventory value calculation
  const totalInventoryValue = rentables.reduce(
    (sum, item) => sum + item.unitPrice * item.count,
    0,
  );

  return {
    rentables,
    budgets: budgets.slice(0, 5), // Recent 5 budgets for dashboard
    totalRevenue,
    totalBudgets,
    approvedBudgets,
    expiredBudgets,
    totalClients,
    recentBudgets: recentBudgets.length,
    monthlyRevenue,
    totalDeliveries,
    recentDeliveries,
    monthlyDeliveries,
    totalInventoryValue,
  };
}

function InventoryCard({ rentable }: { rentable: Rentable }) {
  const { load, data } = useFetcher<{ inventory: number | null }>();

  useEffect(() => {
    load(`/rentablesinventory/?id=${rentable.id}`);
  }, [load, rentable.id]);

  const totalRented = data?.inventory ?? 0;
  const utilizationRate = (totalRented / rentable.count) * 100;

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
      <CardHeader pb={2}>
        <Heading size="sm">{rentable.name}</Heading>
      </CardHeader>
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">
              Utilização
            </Text>
            <Text fontSize="sm" fontWeight="bold">
              {utilizationRate.toFixed(1)}%
            </Text>
          </HStack>

          <Progress
            value={utilizationRate}
            colorScheme={
              utilizationRate > 80
                ? "red"
                : utilizationRate > 60
                  ? "yellow"
                  : "green"
            }
            size="md"
            borderRadius="md"
          />

          <SimpleGrid columns={3} spacing={2} fontSize="sm">
            <VStack spacing={0}>
              <Text color="gray.600">Alugado</Text>
              <Text fontWeight="bold" color="orange.500">
                {totalRented}
              </Text>
            </VStack>
            <VStack spacing={0}>
              <Text color="gray.600">Livre</Text>
              <Text fontWeight="bold" color="green.500">
                {rentable.count - totalRented}
              </Text>
            </VStack>
            <VStack spacing={0}>
              <Text color="gray.600">Total</Text>
              <Text fontWeight="bold">{rentable.count}</Text>
            </VStack>
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  );
}

function RevenueChart({ monthlyRevenue }: { monthlyRevenue: number[] }) {
  const maxRevenue = Math.max(...monthlyRevenue);
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md">Receita Mensal ({dayjs().year()})</Heading>
      <HStack spacing={2} align="end" h="200px">
        {monthlyRevenue.map((revenue, index) => {
          const height = maxRevenue > 0 ? (revenue / maxRevenue) * 160 : 0;
          return (
            <VStack key={index} spacing={1} flex={1}>
              <Text fontSize="xs" fontWeight="bold">
                {revenue > 0
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                    }).format(revenue / 100)
                  : ""}
              </Text>
              <Box
                bg="blue.500"
                w="100%"
                h={`${height}px`}
                borderRadius="sm"
                minH="2px"
              />
              <Text fontSize="xs" color="gray.600">
                {months[index]}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
}

function DeliveryChart({ monthlyDeliveries }: { monthlyDeliveries: number[] }) {
  const maxDeliveries = Math.max(...monthlyDeliveries);
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return (
    <VStack spacing={4} align="stretch">
      <HStack>
        <Icon as={FiTruck} color="green.500" />
        <Heading size="md">Movimentação Mensal</Heading>
      </HStack>
      <HStack spacing={1} align="end" h="150px">
        {monthlyDeliveries.map((count, index) => {
          const height = maxDeliveries > 0 ? (count / maxDeliveries) * 120 : 0;
          return (
            <VStack key={index} spacing={1} flex={1}>
              <Text fontSize="xs" fontWeight="bold">
                {count > 0 ? count : ""}
              </Text>
              <Box
                bg="green.500"
                w="100%"
                h={`${height}px`}
                borderRadius="sm"
                minH="2px"
              />
              <Text fontSize="xs" color="gray.600">
                {months[index]}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
}

function InventoryMetrics({
  totalValue,
  itemCount,
}: {
  totalValue: number;
  itemCount: number;
}) {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4}>
          <HStack>
            <Icon as={FiPackage} color="blue.500" boxSize={6} />
            <Heading size="md">Inventário Total</Heading>
          </HStack>

          <CircularProgress value={75} color="blue.500" size="120px">
            <CircularProgressLabel>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold">
                  {itemCount}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  tipos
                </Text>
              </VStack>
            </CircularProgressLabel>
          </CircularProgress>

          <VStack spacing={1}>
            <Text fontSize="sm" color="gray.600">
              Valor Total
            </Text>
            <Text fontSize="xl" fontWeight="bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(totalValue / 100)}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  const {
    rentables,
    budgets,
    totalRevenue,
    totalBudgets,
    approvedBudgets,
    expiredBudgets,
    totalClients,
    recentBudgets,
    monthlyRevenue,
    totalDeliveries,
    recentDeliveries,
    monthlyDeliveries,
    totalInventoryValue,
  } = useLoaderData<typeof loader>();

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="8">
        <Heading as="h1" size="2xl">
          Dashboard
        </Heading>

        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={6}>
          <Stat
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
          >
            <StatLabel>
              <HStack>
                <Icon as={FiTrendingUp} color="green.500" />
                <Text>Receita Total</Text>
              </HStack>
            </StatLabel>
            <StatNumber>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(totalRevenue / 100)}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {approvedBudgets} aprovados
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
          >
            <StatLabel>
              <HStack>
                <Icon as={FiActivity} color="blue.500" />
                <Text>Orçamentos</Text>
              </HStack>
            </StatLabel>
            <StatNumber>{totalBudgets}</StatNumber>
            <StatHelpText>
              <Text color="blue.500">{recentBudgets} esta semana</Text>
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
          >
            <StatLabel>
              <HStack>
                <Icon as={FiTruck} color="purple.500" />
                <Text>Movimentações</Text>
              </HStack>
            </StatLabel>
            <StatNumber>{totalDeliveries}</StatNumber>
            <StatHelpText>
              <Text color="purple.500">{recentDeliveries} esta semana</Text>
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
          >
            <StatLabel>
              <HStack>
                <Icon as={FiPackage} color="orange.500" />
                <Text>Inventário</Text>
              </HStack>
            </StatLabel>
            <StatNumber>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(totalInventoryValue / 100)}
            </StatNumber>
            <StatHelpText>
              <Text color="orange.500">{rentables.length} tipos</Text>
            </StatHelpText>
          </Stat>

          <Stat
            p={4}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
          >
            <StatLabel>Clientes Ativos</StatLabel>
            <StatNumber>{totalClients}</StatNumber>
            <StatHelpText>
              <Text color="red.500">{expiredBudgets} expirados</Text>
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Inventory Overview */}
        <VStack spacing={4} align="stretch">
          <Heading size="lg">Inventário</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {rentables.map((item) => (
              <InventoryCard key={item.id} rentable={item} />
            ))}
          </SimpleGrid>
        </VStack>

        {/* Charts Section */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr 1fr" }} gap={8}>
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <RevenueChart monthlyRevenue={monthlyRevenue} />
            </CardBody>
          </Card>

          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <DeliveryChart monthlyDeliveries={monthlyDeliveries} />
            </CardBody>
          </Card>

          <InventoryMetrics
            totalValue={totalInventoryValue}
            itemCount={rentables.length}
          />
        </Grid>

        {/* Recent Budgets */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="lg">Orçamentos Recentes</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {budgets.map((budget) => (
                <HStack
                  key={budget.id}
                  justify="space-between"
                  p={3}
                  bg={useColorModeValue("gray.50", "gray.600")}
                  borderRadius="md"
                >
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{budget.client.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {budget.buildingSite.name}
                    </Text>
                  </VStack>
                  <VStack align="end" spacing={0}>
                    <Badge colorScheme={getBudgetStatusColor(budget.status)}>
                      {getBudgetStatusLabel(budget.status)}
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(budget.total / 100)}
                    </Text>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
