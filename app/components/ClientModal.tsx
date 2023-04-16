import type { Client } from "@prisma/client";
import { Form, useActionData } from "@remix-run/react";

import {
  Button,
  FormControl,
  FormErrorMessage,
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
  Radio,
  RadioGroup,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

interface ClientModalProps {
  onClose: () => void;
  editionMode?: boolean;
  values?: Omit<Client, "createdAt" | "updatedAt">;
}

export function ClientModal(props: ClientModalProps) {
  const { onClose, editionMode, values } = props;

  const [label, setLabel] = useState<"CNPJ" | "CPF">("CPF");

  const actionData = useActionData<{ fieldErrors: Partial<Client> }>();

  return (
    <Modal size="xl" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editionMode ? "Editar" : "Criar"} Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Form method="post" id="client-form" onChange={(e) => {}}>
            <FormControl as="fieldset">
              <FormLabel as="legend">Pessoa Jurídica</FormLabel>
              <RadioGroup
                name="isLegalEntity"
                defaultValue="false"
                onChange={(value) => {
                  value === "true" ? setLabel("CNPJ") : setLabel("CPF");
                }}
              >
                <HStack spacing={4}>
                  <Radio value="true">Sim</Radio>
                  <Radio value="false" defaultChecked>
                    Não
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl
              isInvalid={Boolean(actionData?.fieldErrors?.registrationNumber)}
            >
              <FormLabel htmlFor="registrationNumber">{label}</FormLabel>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                defaultValue={values?.registrationNumber ?? ""}
                minLength={11}
                onBlur={async (e) => {
                  const form = e.target.form;

                  if (
                    e.target.value.length === 18 &&
                    form?.isLegalEntity.value === "true"
                  ) {
                    const res = await fetch(
                      `https://api-publica.speedio.com.br/buscarcnpj?cnpj=${e.target.value
                        .replaceAll(".", "")
                        .replaceAll("/", "")
                        .replaceAll("-", "")}`
                    );

                    const data = await res.json();

                    console.log(data);

                    if (res.ok && form) {
                      form.elements.name.value = data["RAZAO SOCIAL"];
                      form.address.value = data.LOGRADOURO;
                      form.phoneNumber.value = data.TELEFONE;
                    }
                  }
                }}
              />
              {actionData?.fieldErrors?.registrationNumber && (
                <FormErrorMessage>
                  {actionData?.fieldErrors?.registrationNumber}
                </FormErrorMessage>
              )}
            </FormControl>
            <VStack spacing={2}>
              <input type="hidden" name="id" defaultValue={values?.id} />
              <FormControl isInvalid={Boolean(actionData?.fieldErrors?.name)}>
                <FormLabel htmlFor="name">Nome</FormLabel>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={values?.name}
                />
                {actionData?.fieldErrors?.name && (
                  <FormErrorMessage>
                    {actionData?.fieldErrors?.name}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={Boolean(actionData?.fieldErrors?.address)}
              >
                <FormLabel htmlFor="address">Endereço</FormLabel>
                <Input
                  id="address"
                  name="address"
                  required
                  defaultValue={values?.address}
                />
                {actionData?.fieldErrors?.address && (
                  <FormErrorMessage>
                    {actionData?.fieldErrors?.address}
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl
                isInvalid={Boolean(actionData?.fieldErrors?.phoneNumber)}
              >
                <FormLabel htmlFor="phoneNumber">Telefone</FormLabel>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  defaultValue={values?.phoneNumber ?? ""}
                  minLength={10}
                  required
                  type="tel"
                />
                {actionData?.fieldErrors?.phoneNumber && (
                  <FormErrorMessage>
                    {actionData?.fieldErrors?.phoneNumber}
                  </FormErrorMessage>
                )}
              </FormControl>
            </VStack>
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} variant="ghost" mx="4">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-form"
            name="_action"
            value={editionMode ? "edit" : "create"}
          >
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
