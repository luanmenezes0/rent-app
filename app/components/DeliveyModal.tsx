import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  VStack,
} from "@chakra-ui/react";
import type { Delivery, DeliveryUnit } from "@prisma/client";
import { Form, useActionData } from "@remix-run/react";
import dayjs from "dayjs";
import { useState } from "react";
import type { Rentable } from "~/models/inventory.server.";

function SelectArea({
  rentableId,
  initialType,
}: {
  rentableId: number;
  initialType?: "delivery" | "withdrawal";
}) {
  const [type, setType] = useState<"delivery" | "withdrawal">(
    initialType || "delivery"
  );

  return (
    <>
      <Select
        id={`${rentableId}_delivery_type`}
        name={`${rentableId}_delivery_type`}
        onChange={(e) =>
          setType(e.target.value === "1" ? "delivery" : "withdrawal")
        }
        value={type === "delivery" ? "1" : "2"}
      >
        <option value="1">Entrega</option>
        <option value="2">Retirada</option>
      </Select>
      {type === "delivery" ? (
        <TriangleUpIcon color="green" />
      ) : (
        <TriangleDownIcon color="red" />
      )}
    </>
  );
}

interface DeliveryModalProps {
  onClose: () => void;
  buildingSiteId: number;
  editionMode?: boolean;
  values?: Delivery & { units: Array<DeliveryUnit & { rentable: Rentable }> };
  rentables: Omit<Rentable, "createdAt" | "updatedAt">[];
}

export function DeliveyModal({
  onClose,
  buildingSiteId,
  editionMode,
  values,
  rentables,
}: DeliveryModalProps) {
  const actionData = useActionData();

  let mappedRentables = [];

  if (editionMode && values) {
    mappedRentables = values.units.map((item) => ({
      id: item.id,
      type: item.deliveryType,
      name: item.rentable.name,
      count: Math.abs(item.count),
    }));
  } else {
    mappedRentables = rentables.map((rentable) => ({
      id: rentable.id,
      name: rentable.name,
      count: 0,
      type: 1,
    }));
  }

  const initialDateValue = values
    ? dayjs(values.createdAt).format("YYYY-MM-DDTHH:mm")
    : dayjs().format("YYYY-MM-DDTHH:mm");

  return (
    <Modal size="md" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editionMode ? "Editar" : "Nova"} Remessa</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method="post" id="delivery-form" key={values?.id}>
            <input type="hidden" name="id" value={values?.id} />
            <VStack>
              <FormControl>
                <FormLabel htmlFor="notes">Data</FormLabel>
                <Input
                  name="date"
                  placeholder="Select Date and Time"
                  size="md"
                  defaultValue={initialDateValue}
                  type="datetime-local"
                />
              </FormControl>
              <input
                type="hidden"
                name="buildingSiteId"
                value={buildingSiteId}
              />
              {actionData?.fieldErrors?.count && (
                <Alert status="error" borderRadius="16">
                  <AlertIcon />
                  <AlertDescription>
                    {actionData?.fieldErrors?.count}
                  </AlertDescription>
                </Alert>
              )}
              {mappedRentables.map((rentable) => (
                <FormControl
                  display="grid"
                  gridTemplateColumns="1fr 85px 1fr"
                  gap={4}
                  key={rentable.id}
                >
                  <input type="hidden" name="rentableId" value={rentable.id} />
                  <FormLabel
                    htmlFor={`${rentable.id}_count`}
                    alignSelf="center"
                  >
                    {rentable.name}
                  </FormLabel>
                  <Input
                    min={0}
                    type="number"
                    name={`${rentable.id}_count`}
                    id={`${rentable.id}_count`}
                    placeholder=""
                    defaultValue={rentable.count}
                    required
                  />
                  <HStack>
                    <SelectArea
                      rentableId={rentable.id}
                      initialType={
                        rentable.type === 1 ? "delivery" : "withdrawal"
                      }
                    />
                  </HStack>
                </FormControl>
              ))}
            </VStack>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="outline" mx={2}>
            Cancelar
          </Button>
          <Button
            name="_action"
            value={editionMode ? "edit-delivery" : "create-delivery"}
            type="submit"
            form="delivery-form"
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}