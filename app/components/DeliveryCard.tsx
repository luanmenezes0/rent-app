import {
  DeleteIcon,
  EditIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import type { Delivery, DeliveryUnit, Rentable } from "@prisma/client";
import { useActionData, useFetcher, useNavigation } from "@remix-run/react";
import { SerializeFrom } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { GrDeliver, GrPrint } from "react-icons/gr";

import { MyAlertDialog } from "./AlertDialog";
import { DeliveyModal } from "./DeliveyModal";

interface DeliveryCardProps {
  delivery: SerializeFrom<Delivery> & {
    units: (SerializeFrom<DeliveryUnit> & {
      rentable: SerializeFrom<Rentable>;
    })[];
  };
  rentables: SerializeFrom<Rentable>[];
}
const initialState = { show: false, editing: false, data: null };
interface State {
  show: boolean;
  editing: boolean;
  data: DeliveryCardProps["delivery"] | null;
}

export default function DeliveryCard({
  delivery,
  rentables,
}: DeliveryCardProps) {
  const cardColor = useColorModeValue("gray.100", "gray.700");
  const iconBgColor = useColorModeValue("gray.200", "gray.600");

  const navigation = useNavigation();
  const actionData = useActionData<{
    fieldErrors: Record<string, string>;
  }>();

  const [deliveryModal, setDeliveryModal] = useState<State>(initialState);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetcher = useFetcher();

  function handleOpenDeleteModal(id: number) {
    setIdToDelete(id);
    onOpen();
  }

  function handleCloseDeleteModal() {
    setIdToDelete(null);
    onClose();
  }

  function handleDelete(id: number) {
    fetcher.submit({ id, _action: "delete-delivery" }, { method: "delete" });
    handleCloseDeleteModal();
  }

  const isAdding = navigation.state === "submitting";

  useEffect(() => {
    if (!isAdding && !actionData?.fieldErrors) {
      setDeliveryModal(initialState);
    }
  }, [isAdding, actionData]);

  return (
    <>
      <Flex
        bgColor={cardColor}
        gap={4}
        key={delivery.id}
        p="4"
        borderRadius="8"
        flexDirection={{ base: "column", md: "row" }}
      >
        <Flex
          justify="center"
          align="center"
          borderRadius="8"
          display={{ base: "none", md: "flex" }}
          p="2"
          bgColor={iconBgColor}
          h="min-content"
        >
          <Icon color="gray.500" w={8} h={8} as={GrDeliver} />
        </Flex>
        <Box justifySelf="start" flexGrow={1}>
          <HStack pb="2" fontSize="14">
            <Heading as="h3" fontSize="14">
              {delivery.date}
            </Heading>
          </HStack>

          {delivery.units.map((u) => (
            <Flex align="center" gap="2" borderRadius="8" key={u.id}>
              {u.deliveryType === 1 ? (
                <TriangleUpIcon color="green" />
              ) : (
                <TriangleDownIcon color="red" />
              )}
              {u.rentable.name} - {Math.abs(u.count)}{" "}
            </Flex>
          ))}
        </Box>
        <Flex gap={2} justifySelf="flex-end">
          <IconButton
            variant="outline"
            size="sm"
            aria-label="Editar remessa"
            icon={<EditIcon />}
            onClick={() =>
              setDeliveryModal({ show: true, editing: true, data: delivery })
            }
          />

          <IconButton
            variant={"outline"}
            size={"sm"}
            aria-label={"Imprimir"}
            icon={<GrPrint />}
            as="a"
            target="_blank"
            href={`/print-pdf?deliveryId=${delivery.id}`}
          />

          <IconButton
            variant="outline"
            size="sm"
            colorScheme="red"
            aria-label="Deletar remessa"
            icon={<DeleteIcon />}
            onClick={() => handleOpenDeleteModal(delivery.id)}
          />
        </Flex>
      </Flex>
      {deliveryModal.show && rentables && deliveryModal.data ? (
        <DeliveyModal
          onClose={() => setDeliveryModal(initialState)}
          buildingSiteId={delivery.buildingSiteId}
          editionMode={deliveryModal.editing}
          rentables={rentables}
          values={deliveryModal.data}
        />
      ) : null}
      {idToDelete ? (
        <MyAlertDialog
          isOpen={isOpen}
          onClose={onClose}
          onDelete={() => handleDelete(idToDelete)}
          title="Deletar Remessa"
        />
      ) : null}
    </>
  );
}
