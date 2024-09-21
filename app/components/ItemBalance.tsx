import {
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import dayjs from "dayjs";

interface ItemBalanceProps {
  deliveryUnits: RootObject;
}

interface RootObject {
  [key: string]: DeliveryUnit[];
}

interface DeliveryUnit {
  id: number;
  count: number;
  deliveryType: number;
  rentableId: number;
  deliveryId: number;
  buildingSiteId: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  rentable: Rentable;
}

interface Rentable {
  id: number;
  name: string;
  count: number;
  unitPrice: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}
export default function ItemBalance({ deliveryUnits }: ItemBalanceProps) {
  console.table(deliveryUnits["MATERIAL TESTE 1"]);

  function getBalance(arr: any[], i: number) {
    return arr.slice(0, i + 1).reduce((p, c) => p + c.count, 0);
  }

  function getDiffInDays(arr: any[], i: number, date: any) {
    const isLast = arr.length === i + 1;

    const formatedDate = dayjs(date).toISOString();

    if (isLast) {
      return dayjs().diff(dayjs(formatedDate), "day");
    }

    return dayjs(arr[i + 1].date).diff(dayjs(formatedDate), "day");
  }

  return (
    <VStack align="stretch" as="section" gap={2}>
      <Heading
        as="h2"
        size="lg"
        color={useColorModeValue("green.600", "green.100")}
      >
        Balanço Financeiro
      </Heading>
      {Object.entries(deliveryUnits).map(([name, unit]) => (
        <VStack key={name}>
          <Text fontWeight="bold">{name}</Text>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Data</Th>
                <Th>Movimentação</Th>
                <Th>Saldo</Th>
                <Th>Dias</Th>
                <Th>RM * DIAS</Th>
                <Th>VALOR</Th>
              </Tr>
            </Thead>
            <Tbody>
              {unit.map((d, i, arr) => (
                <Tr key={d.id}>
                  <Td>{dayjs(d.date).format("DD/MM/YYYY")}</Td>
                  <Td>{d.count}</Td>
                  <Td>{getBalance(arr, i)}</Td>
                  <Td>{getDiffInDays(arr, i, d.date)}</Td>
                  <Td>{getBalance(arr, i) * getDiffInDays(arr, i, d.date)}</Td>
                  <Td>
                    {getBalance(arr, i) *
                      getDiffInDays(arr, i, d.date) *
                      d.rentable.unitPrice}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </VStack>
      ))}
    </VStack>
  );
}
