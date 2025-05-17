import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  Field,
  HStack,
  Input,
  Select,
  VStack,
} from "@chakra-ui/react";
import type { Delivery, DeliveryUnit } from "@prisma/client";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { SerializeFrom } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { useEffect, useState } from "react";

dayjs.extend(customParseFormat);

import type { Rentable } from "~/models/inventory.server";

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
  values?: SerializeFrom<Delivery> & {
    units: (SerializeFrom<DeliveryUnit> & {
      rentable: SerializeFrom<Rentable>;
    })[];
  };
  rentables: SerializeFrom<Rentable>[];
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

  const navigation = useNavigation();

  const isSubmitting = navigation.state === "loading";

  useEffect(() => {
    if (actionData === null && isSubmitting) {
      onClose();
    }
  }, [actionData, isSubmitting, onClose]);

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
    ? dayjs(values.date, "DD-MM-YYYY HH:mm").format("YYYY-MM-DDTHH:mm")
    : dayjs().format("YYYY-MM-DDTHH:mm");

  return (
    <Dialog.Root size="lg" isOpen onClose={onClose}>
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>
              {editionMode ? "Editar" : "Nova"} Remessa
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body>
            <Form
              method={editionMode ? "PUT" : "POST"}
              id="delivery-form"
              key={values?.id}
            >
              <input type="hidden" name="id" value={values?.id} />
              <VStack>
                <Field.Root>
                  <Field.Label htmlFor="notes">Data</Field.Label>
                  <Input
                    name="date"
                    placeholder="Select Date and Time"
                    size="md"
                    defaultValue={initialDateValue}
                    type="datetime-local"
                  />
                </Field.Root>
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
                  <Field.Root
                    display="grid"
                    gridTemplateColumns="1fr 70px auto"
                    gap={4}
                    key={rentable.id}
                  >
                    <input
                      type="hidden"
                      name="rentableId"
                      value={rentable.id}
                    />
                    <Field.Label
                      htmlFor={`${rentable.id}_count`}
                      alignSelf="center"
                    >
                      {rentable.name}
                    </Field.Label>
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
                  </Field.Root>
                ))}
              </VStack>
            </Form>
          </Dialog.Body>
          <Dialog.Footer>
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
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
