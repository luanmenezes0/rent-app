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
import { Form, useActionData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Rentable } from "~/models/inventory.server.";

function SelectArea({ rentableId }: { rentableId: number }) {
  const [type, setType] = useState<"delivery" | "withdrawal">("delivery");

  return (
    <>
      <Select
        id={`${rentableId}_delivery_type`}
        name={`${rentableId}_delivery_type`}
        onChange={(e) =>
          setType(e.target.value === "1" ? "delivery" : "withdrawal")
        }
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
}

export function DeliveyModal({ onClose, buildingSiteId }: DeliveryModalProps) {
  const fetcher = useFetcher<{ rentables: Rentable[] }>();

  const actionData = useActionData();

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.load("/inventory");
    }
  }, [fetcher]);

  return (
    <Modal size="md" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nova Remessa</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method="post" id="delivery-form">
            <VStack>
              <FormControl>
                <FormLabel htmlFor="notes">Data</FormLabel>
                <Input
                  name="date"
                  placeholder="Select Date and Time"
                  size="md"
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
              {fetcher.data?.rentables.map((rentable) => (
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
                    defaultValue={0}
                    required
                  />
                  <HStack>
                    <SelectArea rentableId={rentable.id} />
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
            value="create-delivery"
            type="submit"
            form="delivery-form"
          >
            Criar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
