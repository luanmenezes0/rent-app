import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCheck,
  FiClock,
  FiEdit3,
  FiEye,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiPrinter,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import invariant from "tiny-invariant";

import BuildingSiteModal from "~/components/BuildingSiteModal";
import BuildingSiteStatusLabel from "~/components/BuildingSiteStatusLabel";
import { ClientModal } from "~/components/ClientModal";
import Header from "~/components/Header";
import { createBuildingSite } from "~/models/buildingSite.server";
import { editClient, getClient } from "~/models/client.server";
import { requireUserId } from "~/session.server";
import { parseZodError, validationError } from "~/utils";
import {
  getBudgetStatusColor,
  getBudgetStatusLabel,
} from "~/utils/budgetStatus";
import { BuildingSiteSchema } from "~/validators/buildingSiteValidator";
import { ClientSchema } from "~/validators/clientValidation";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  const client = await getClient(params.clientId);

  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }

  // Calculate client analytics
  const totalRevenue = client.budgets
    .filter((b) => b.status === "APPROVED")
    .reduce((sum, budget) => sum + budget.total, 0);

  const totalBudgets = client.budgets.length;
  const approvedBudgets = client.budgets.filter(
    (b) => b.status === "APPROVED",
  ).length;
  const activeBuildingSites = client.buildingSites.filter(
    (bs) => bs.status === 1,
  ).length;

  // Recent activity (last 30 days)
  const recentBudgets = client.budgets.filter((b) =>
    dayjs(b.createdAt).isAfter(dayjs().subtract(30, "day")),
  );

  // Monthly revenue for current year
  const monthlyRevenue = Array.from({ length: 12 }, (_, month) => {
    const monthRevenue = client.budgets
      .filter(
        (b) =>
          b.status === "APPROVED" &&
          dayjs(b.createdAt).month() === month &&
          dayjs(b.createdAt).year() === dayjs().year(),
      )
      .reduce((sum, budget) => sum + budget.total, 0);
    return monthRevenue;
  });

  return {
    client,
    analytics: {
      totalRevenue,
      totalBudgets,
      approvedBudgets,
      activeBuildingSites,
      recentBudgets: recentBudgets.length,
      monthlyRevenue,
    },
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);

  invariant(params.clientId, "clientId not found");

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "create-bs": {
      const result = BuildingSiteSchema.safeParse(
        Object.fromEntries(formData.entries()),
      );

      if (!result.success) {
        return validationError(parseZodError(result.error));
      }

      await createBuildingSite({
        address: result.data.address,
        clientId: Number(params.clientId),
        name: result.data.name,
      });

      return null;
    }

    case "edit": {
      const result = ClientSchema.safeParse(
        Object.fromEntries(formData.entries()),
      );

      if (!result.success) {
        return validationError(parseZodError(result.error));
      }

      await editClient({
        address: result.data.address,
        name: result.data.name,
        phoneNumber: result.data.phoneNumber,
        isLegalEntity: result.data.isLegalEntity === "true",
        registrationNumber: result.data.registrationNumber ?? null,
        id: Number(result.data.id),
        city: result.data.city,
        state: result.data.state,
        neighborhood: result.data.neighborhood,
        email: result.data.email ?? null,
        streetCode: result.data.streetCode ?? null,
      });

      return null;
    }

    default:
      throw new Error("unknown action");
  }
}

function ClientRevenueChart({ monthlyRevenue }: { monthlyRevenue: number[] }) {
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
      <HStack spacing={2} align="end" h="150px">
        {monthlyRevenue.map((revenue, index) => {
          const height = maxRevenue > 0 ? (revenue / maxRevenue) * 120 : 0;
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
              <Text fontSize="xs" color="gray.700">
                {months[index]}
              </Text>
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
}

export default function Client() {
  const { client, analytics } = useLoaderData<typeof loader>();

  const { isOpen, onClose, onOpen } = useDisclosure();
  const [show, setShow] = useState(false);

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.400");

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="8">
        {/* Client Header */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
              {/* Client Info */}
              <VStack align="start" spacing={6}>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FiUser} color="blue.500" boxSize={6} />
                    <Heading as="h1" size="xl">
                      {client.name}
                    </Heading>
                    {client.isLegalEntity && (
                      <Badge colorScheme="purple" variant="subtle">
                        Pessoa Jurídica
                      </Badge>
                    )}
                  </HStack>
                  <Text color={secondaryTextColor} fontSize="lg">
                    Cliente desde {dayjs(client.createdAt).format("MMMM YYYY")}
                  </Text>
                </VStack>

                {/* Contact Info */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={FiMapPin} color="gray.500" />
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">
                          Endereço
                        </Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {client.address}, {client.neighborhood}
                        </Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {client.city} - {client.state}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Icon as={FiPhone} color="gray.500" />
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">
                          Telefone
                        </Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {client.phoneNumber}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>

                  <VStack align="start" spacing={3}>
                    {client.email && (
                      <HStack>
                        <Icon as={FiMail} color="gray.500" />
                        <Box>
                          <Text fontSize="sm" fontWeight="bold">
                            Email
                          </Text>
                          <Text fontSize="sm" color={secondaryTextColor}>
                            {client.email}
                          </Text>
                        </Box>
                      </HStack>
                    )}

                    <HStack>
                      <Icon as={FiFileText} color="gray.500" />
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">
                          {client.isLegalEntity ? "CNPJ" : "CPF"}
                        </Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {client.registrationNumber || "-"}
                        </Text>
                      </Box>
                    </HStack>
                  </VStack>
                </SimpleGrid>

                {/* Action Buttons */}
                <HStack spacing={3} pt={4}>
                  <Button colorScheme="blue" onClick={onOpen}>
                    Editar Cliente
                  </Button>
                  <Button variant="outline" onClick={() => setShow(true)}>
                    Adicionar Obra
                  </Button>
                  <Button
                    as={Link}
                    to={`/budgets/new?clientId=${client.id}`}
                    variant="outline"
                    colorScheme="green"
                  >
                    Criar Orçamento
                  </Button>
                </HStack>
              </VStack>

              {/* Client Analytics */}
              <VStack spacing={4} align="stretch">
                <Heading size="md">Resumo</Heading>
                <SimpleGrid columns={2} spacing={4}>
                  <Stat p={4} bg={cardBg} borderRadius="md">
                    <StatLabel>Receita Total</StatLabel>
                    <StatNumber fontSize="lg">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(analytics.totalRevenue / 100)}
                    </StatNumber>
                    <StatHelpText>
                      {analytics.approvedBudgets} aprovados
                    </StatHelpText>
                  </Stat>

                  <Stat p={4} bg={cardBg} borderRadius="md">
                    <StatLabel>Orçamentos</StatLabel>
                    <StatNumber fontSize="lg">
                      {analytics.totalBudgets}
                    </StatNumber>
                    <StatHelpText>
                      {analytics.recentBudgets} este mês
                    </StatHelpText>
                  </Stat>

                  <Stat p={4} bg={cardBg} borderRadius="md">
                    <StatLabel>Obras Ativas</StatLabel>
                    <StatNumber fontSize="lg">
                      {analytics.activeBuildingSites}
                    </StatNumber>
                    <StatHelpText>
                      de {client.buildingSites.length} total
                    </StatHelpText>
                  </Stat>

                  <Stat p={4} bg={cardBg} borderRadius="md">
                    <StatLabel>Taxa Aprovação</StatLabel>
                    <StatNumber fontSize="lg">
                      {analytics.totalBudgets > 0
                        ? Math.round(
                            (analytics.approvedBudgets /
                              analytics.totalBudgets) *
                              100,
                          )
                        : 0}
                      %
                    </StatNumber>
                    <StatHelpText>
                      <Icon as={FiTrendingUp} color="green.500" />
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </VStack>
            </Grid>
          </CardBody>
        </Card>

        {/* Building Sites and Budgets */}
        <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={8}>
          {/* Building Sites */}
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FiBriefcase} color="blue.500" boxSize={5} />
                  <Heading size="lg">Obras</Heading>
                  <Badge colorScheme="blue" variant="subtle">
                    {client.buildingSites.length}
                  </Badge>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<Icon as={FiPlus} />}
                  onClick={() => setShow(true)}
                >
                  Nova Obra
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              {client.buildingSites.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {client.buildingSites.map((bs) => {
                    const budgetsForSite = client.budgets.filter(
                      (b) => b.buildingSiteId === bs.id,
                    );
                    const approvedBudgetsForSite = budgetsForSite.filter(
                      (b) => b.status === "APPROVED",
                    );
                    const totalRevenueForSite = approvedBudgetsForSite.reduce(
                      (sum, budget) => sum + budget.total,
                      0,
                    );

                    return (
                      <HStack
                        key={bs.id}
                        justify="space-between"
                        p={4}
                        bg={cardBg}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FiMapPin} color="gray.500" boxSize={4} />
                            <Text fontWeight="bold" fontSize="md">
                              {bs.name}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={secondaryTextColor}>
                            {bs.address}
                          </Text>
                          <HStack spacing={3}>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {budgetsForSite.length} orçamentos
                            </Text>
                            <Text fontSize="xs" color="green.500">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                notation: "compact",
                              }).format(totalRevenueForSite / 100)}
                            </Text>
                          </HStack>
                        </VStack>

                        <VStack align="end" spacing={2}>
                          <BuildingSiteStatusLabel status={bs.status} />
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="green"
                              as={Link}
                              to={`/budgets/new?clientId=${client.id}&buildingSiteId=${bs.id}`}
                            >
                              Criar Orçamento
                            </Button>
                            <IconButton
                              size="sm"
                              variant="outline"
                              aria-label="Ver detalhes"
                              icon={<Icon as={FiEye} />}
                              as={Link}
                              to={`/building-sites/${bs.id}`}
                            />
                          </HStack>
                        </VStack>
                      </HStack>
                    );
                  })}
                </VStack>
              ) : (
                <VStack spacing={6} py={12}>
                  <Icon as={FiBriefcase} boxSize={12} color="gray.400" />
                  <VStack spacing={2}>
                    <Text color="gray.500" fontSize="lg" fontWeight="medium">
                      Nenhuma obra cadastrada
                    </Text>
                    <Text
                      color={secondaryTextColor}
                      fontSize="sm"
                      textAlign="center"
                    >
                      Adicione uma obra para começar a criar orçamentos
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="blue"
                    leftIcon={<Icon as={FiPlus} />}
                    onClick={() => setShow(true)}
                  >
                    Criar Primeira Obra
                  </Button>
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* Budgets */}
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FiFileText} color="green.500" boxSize={5} />
                  <Heading size="lg">Orçamentos</Heading>
                  <Badge colorScheme="green" variant="subtle">
                    {client.budgets.length}
                  </Badge>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                  leftIcon={<Icon as={FiPlus} />}
                  as={Link}
                  to={`/budgets/new?clientId=${client.id}`}
                >
                  Novo Orçamento
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              {client.budgets.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {client.budgets.slice(0, 6).map((budget) => {
                    const isExpired =
                      dayjs(budget.validityDate).isBefore(dayjs()) &&
                      budget.status !== "APPROVED";
                    const daysUntilExpiry = dayjs(budget.validityDate).diff(
                      dayjs(),
                      "day",
                    );
                    const isExpiringSoon =
                      daysUntilExpiry <= 7 &&
                      daysUntilExpiry > 0 &&
                      budget.status !== "APPROVED";

                    const getStatusIcon = (status: string) => {
                      switch (status) {
                        case "APPROVED":
                          return FiCheck;
                        case "REJECTED":
                          return FiX;
                        case "EXPIRED":
                          return FiClock;
                        case "SENT":
                          return FiAlertCircle;
                        default:
                          return FiFileText;
                      }
                    };

                    return (
                      <HStack
                        key={budget.id}
                        justify="space-between"
                        p={4}
                        bg={cardBg}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={
                          isExpired
                            ? "red.200"
                            : isExpiringSoon
                              ? "orange.200"
                              : borderColor
                        }
                        borderLeftWidth="4px"
                        borderLeftColor={
                          budget.status === "APPROVED"
                            ? "green.500"
                            : budget.status === "REJECTED"
                              ? "red.500"
                              : isExpired
                                ? "red.500"
                                : isExpiringSoon
                                  ? "orange.500"
                                  : "blue.500"
                        }
                      >
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon
                              as={getStatusIcon(budget.status)}
                              color={
                                getBudgetStatusColor(budget.status) + ".500"
                              }
                              boxSize={4}
                            />
                            <Text fontWeight="bold" fontSize="md">
                              {budget.buildingSite.name}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={secondaryTextColor}>
                            Válido até{" "}
                            {dayjs(budget.validityDate).format("DD/MM/YYYY")}
                          </Text>
                          {(isExpired || isExpiringSoon) && (
                            <HStack>
                              <Icon
                                as={FiClock}
                                color={isExpired ? "red.500" : "orange.500"}
                                boxSize={3}
                              />
                              <Text
                                fontSize="xs"
                                color={isExpired ? "red.500" : "orange.500"}
                                fontWeight="medium"
                              >
                                {isExpired
                                  ? "Expirado"
                                  : `Expira em ${daysUntilExpiry} dias`}
                              </Text>
                            </HStack>
                          )}
                        </VStack>

                        <VStack align="end" spacing={2}>
                          <Badge
                            colorScheme={getBudgetStatusColor(budget.status)}
                            variant="subtle"
                          >
                            {getBudgetStatusLabel(budget.status)}
                          </Badge>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="green.600"
                          >
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              notation: "compact",
                            }).format(budget.total / 100)}
                          </Text>
                          <HStack spacing={1}>
                            {budget.status === "DRAFT" && (
                              <IconButton
                                size="sm"
                                variant="outline"
                                aria-label="Editar orçamento"
                                icon={<Icon as={FiEdit3} />}
                                as={Link}
                                to={`/budgets/${budget.id}/edit`}
                              />
                            )}
                            <IconButton
                              size="sm"
                              variant="outline"
                              aria-label="Ver orçamento"
                              icon={<Icon as={FiEye} />}
                              as={Link}
                              to={`/budgets/${budget.id}`}
                            />
                            {budget.status === "APPROVED" && (
                              <IconButton
                                size="sm"
                                variant="outline"
                                aria-label="Imprimir orçamento"
                                icon={<Icon as={FiPrinter} />}
                                as={Link}
                                to={`/budgets/${budget.id}/print`}
                                target="_blank"
                              />
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                    );
                  })}

                  {client.budgets.length > 6 && (
                    <Card
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <CardBody py={4}>
                        <VStack spacing={2}>
                          <Text
                            fontSize="sm"
                            color={secondaryTextColor}
                            textAlign="center"
                          >
                            +{client.budgets.length - 6} orçamentos adicionais
                          </Text>
                          <Button
                            size="sm"
                            variant="outline"
                            as={Link}
                            to={`/budgets?clientId=${client.id}`}
                          >
                            Ver Todos os Orçamentos
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              ) : (
                <VStack spacing={6} py={12}>
                  <Icon as={FiFileText} boxSize={12} color="gray.400" />
                  <VStack spacing={2}>
                    <Text color="gray.500" fontSize="lg" fontWeight="medium">
                      Nenhum orçamento criado
                    </Text>
                    <Text
                      color={secondaryTextColor}
                      fontSize="sm"
                      textAlign="center"
                    >
                      Crie um orçamento para começar a negociar com este cliente
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="green"
                    leftIcon={<Icon as={FiPlus} />}
                    as={Link}
                    to={`/budgets/new?clientId=${client.id}`}
                  >
                    Criar Primeiro Orçamento
                  </Button>
                </VStack>
              )}
            </CardBody>
          </Card>
        </Grid>

        {/* Revenue Chart */}
        {analytics.monthlyRevenue.some((revenue) => revenue > 0) && (
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <ClientRevenueChart monthlyRevenue={analytics.monthlyRevenue} />
            </CardBody>
          </Card>
        )}
      </Container>

      {/* Modals */}
      {show ? (
        <BuildingSiteModal client={client} onClose={() => setShow(false)} />
      ) : null}
      {isOpen ? (
        <ClientModal onClose={onClose} editionMode values={client} />
      ) : null}
    </>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
