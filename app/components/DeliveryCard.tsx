import {
  DeleteIcon,
  EditIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  IconButton,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import type { DeliveryUnit } from "@prisma/client";
import { useActionData, useFetcher, useNavigation } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { GrDeliver } from "react-icons/gr";
import { MyAlertDialog } from "./AlertDialog";
import { DeliveyModal } from "./DeliveyModal";

type DeliveryCardProps = {
  delivery: any & {
    units: Array<DeliveryUnit & { rentable: any }>;
  };
  hideActions?: boolean;
  buildingSite?: any;
  rentables?: any[];
};
const initialState = { show: false, editing: false, data: null };
type State = { show: boolean; editing: boolean; data: any };

export default function DeliveryCard({
  delivery,
  hideActions,
  buildingSite,
  rentables,
}: DeliveryCardProps) {
  const cardColor = useColorModeValue("gray.100", "gray.700");
  const iconBgColor = useColorModeValue("gray.200", "gray.600");

  const navigation = useNavigation();
  const actionData = useActionData();

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
    <Grid
      templateColumns="min-content 1fr min-content min-content"
      bgColor={cardColor}
      gap={2}
      key={delivery.id}
      p="4"
      borderRadius="8"
    >
      <Flex
        justify="center"
        align="center"
        borderRadius="8"
        p="2"
        bgColor={iconBgColor}
        h="min-content"
      >
        <Icon color="gray.500" w={8} h={8} as={GrDeliver} />
      </Flex>
      <Box justifySelf="start" paddingInline="4">
        <Heading as="h3" fontSize="14" pb="2">
          {dayjs(delivery.date).format("DD/MM/YYYY HH:mm")}
        </Heading>
        {/* @ts-ignore */}
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
      {!hideActions && (
        <IconButton
          variant="outline"
          size="sm"
          aria-label="Editar remessa"
          icon={<EditIcon />}
          onClick={() =>
            setDeliveryModal({ show: true, editing: true, data: delivery })
          }
        />
      )}
      {!hideActions && (
        <IconButton
          variant="outline"
          size="sm"
          colorScheme="red"
          aria-label="Deletar remessa"
          icon={<DeleteIcon />}
          onClick={() => handleOpenDeleteModal(delivery.id)}
        />
      )}

      {deliveryModal.show && rentables && (
        <DeliveyModal
          onClose={() => setDeliveryModal(initialState)}
          buildingSiteId={buildingSite.id}
          editionMode={deliveryModal.editing}
          rentables={rentables}
          values={deliveryModal.data}
        />
      )}

      {idToDelete && (
        <MyAlertDialog
          isOpen={isOpen}
          onClose={onClose}
          onDelete={() => handleDelete(idToDelete)}
          title="Deletar Remessa"
        />
      )}
    </Grid>
  );
}
