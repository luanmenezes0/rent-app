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

import type { Rentable } from "~/models/inventory.server";
import { OmitDate } from "~/utils";

function SelectArea({
  rentableId,
  initialType,
}: {
  rentableId: number;
  initialType?: "delivery" | "withdrawal";
}) {
  const [type, setType] = useState<"delivery" | "withdrawal">(
    initialType || "delivery",
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
        <option value="2">Devolução</option>
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
  values?: OmitDate<Delivery> & {
    units: (OmitDate<DeliveryUnit> & { rentable: OmitDate<Rentable> })[];
  };
  rentables: OmitDate<Rentable>[];
}

export function DeliveyModal({
  onClose,
  buildingSiteId,
  editionMode,
  values,
  rentables,
}: DeliveryModalProps) {
  const actionData = useActionData<{
    fieldErrors: Record<string, string>;
  }>();

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
    ? dayjs(values.date).format("YYYY-MM-DDTHH:mm")
    : dayjs().format("YYYY-MM-DDTHH:mm");

  return (
    <Modal size="lg" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editionMode ? "Editar" : "Nova"} Remessa</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form
            method={editionMode ? "PUT" : "POST"}
            id="delivery-form"
            key={values?.id}
          >
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
              {actionData?.fieldErrors?.count ? (
                <Alert status="error" borderRadius="16">
                  <AlertIcon />
                  <AlertDescription>
                    {actionData?.fieldErrors?.count}
                  </AlertDescription>
                </Alert>
              ) : null}
              {mappedRentables.map((rentable) => (
                <FormControl
                  display="grid"
                  gridTemplateColumns="1fr 70px auto"
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
