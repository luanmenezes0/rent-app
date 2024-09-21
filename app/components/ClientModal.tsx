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
import type { Client } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { SerializeFrom } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";

interface ClientModalProps {
  onClose: () => void;
  editionMode?: boolean;
  values?: SerializeFrom<Client>;
}

export function ClientModal(props: ClientModalProps) {
  const { onClose, editionMode, values } = props;

  const fetcher = useFetcher<{ fieldErrors: Record<keyof Client, string> }>();

  const [label, setLabel] = useState<"CNPJ" | "CPF">(() => {
    if (editionMode && values) {
      return values.isLegalEntity ? "CNPJ" : "CPF";
    }

    return "CPF";
  });

  useEffect(() => {
    if (fetcher.data === null) {
      onClose();
    }
  }, [fetcher.data, onClose]);

  return (
    <Modal size="xl" isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editionMode ? "Editar" : "Criar"} Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <fetcher.Form method="PUT" id="client-form">
            <FormControl as="fieldset">
              <FormLabel as="legend">Pessoa Jurídica</FormLabel>
              <RadioGroup
                name="isLegalEntity"
                defaultValue={
                  editionMode ? values?.isLegalEntity.toString() : "false"
                }
                onChange={(value) =>
                  value === "true" ? setLabel("CNPJ") : setLabel("CPF")
                }
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
              isInvalid={Boolean(fetcher.data?.fieldErrors?.registrationNumber)}
            >
              <FormLabel htmlFor="registrationNumber">{label}</FormLabel>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                defaultValue={values?.registrationNumber ?? ""}
                minLength={11}
                onBlur={async (e) => {
                  const form = e.target.form;

                  const legalEntityChecked =
                    form?.isLegalEntity.value === "true";

                  const inputValue = e.target.value
                    .replaceAll(".", "")
                    .replaceAll("/", "")
                    .replaceAll("-", "");

                  if (inputValue.length === 14 && legalEntityChecked) {
                    const res = await fetch(
                      `https://api-publica.speedio.com.br/buscarcnpj?cnpj=${e.target.value
                        .replaceAll(".", "")
                        .replaceAll("/", "")
                        .replaceAll("-", "")}`,
                    );

                    const data = await res.json();

                    if (res.ok && form) {
                      const name = form.elements.namedItem(
                        "name",
                      ) as HTMLInputElement | null;
                      if (name) name.value = data["RAZAO SOCIAL"];
                      form.address.value = `${data["TIPO LOGRADOURO"]} ${data.LOGRADOURO}, ${data.NUMERO}`;
                      form.phoneNumber.value = data.TELEFONE;
                      form.neighborhood.value = data.BAIRRO;
                      form.city.value = data.MUNICIPIO;
                      form.state.value = data.UF;
                    }
                  }
                }}
              />
              {fetcher.data?.fieldErrors?.registrationNumber ? (
                <FormErrorMessage>
                  {fetcher.data?.fieldErrors?.registrationNumber}
                </FormErrorMessage>
              ) : null}
            </FormControl>
            <VStack spacing={2}>
              <input type="hidden" name="id" defaultValue={values?.id} />
              <FormControl isInvalid={Boolean(fetcher.data?.fieldErrors?.name)}>
                <FormLabel htmlFor="name">Nome</FormLabel>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={values?.name}
                />
                {fetcher.data?.fieldErrors?.name ? (
                  <FormErrorMessage>
                    {fetcher.data?.fieldErrors?.name}
                  </FormErrorMessage>
                ) : null}
              </FormControl>
              <FormControl
                isInvalid={Boolean(fetcher.data?.fieldErrors?.address)}
              >
                <FormLabel htmlFor="address">Endereço</FormLabel>
                <Input
                  id="address"
                  name="address"
                  required
                  defaultValue={values?.address}
                />
                {fetcher.data?.fieldErrors?.address ? (
                  <FormErrorMessage>
                    {fetcher.data?.fieldErrors?.address}
                  </FormErrorMessage>
                ) : null}
              </FormControl>
              <HStack>
                <FormControl
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.neighborhood)}
                >
                  <FormLabel htmlFor="neighborhood">Bairro</FormLabel>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    required
                    defaultValue={values?.neighborhood}
                  />
                  {fetcher.data?.fieldErrors?.neighborhood ? (
                    <FormErrorMessage>
                      {fetcher.data?.fieldErrors?.neighborhood}
                    </FormErrorMessage>
                  ) : null}
                </FormControl>

                <FormControl
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.city)}
                >
                  <FormLabel htmlFor="city">Cidade</FormLabel>
                  <Input
                    id="city"
                    name="city"
                    required
                    defaultValue={values?.city ?? ""}
                  />
                  {fetcher.data?.fieldErrors?.city ? (
                    <FormErrorMessage>
                      {fetcher.data?.fieldErrors?.city}
                    </FormErrorMessage>
                  ) : null}
                </FormControl>
              </HStack>
              <HStack>
                <FormControl
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.phoneNumber)}
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
                  {fetcher.data?.fieldErrors?.phoneNumber ? (
                    <FormErrorMessage>
                      {fetcher.data?.fieldErrors?.phoneNumber}
                    </FormErrorMessage>
                  ) : null}
                </FormControl>

                <FormControl
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.state)}
                >
                  <FormLabel htmlFor="state">UF</FormLabel>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={values?.state ?? ""}
                    required
                  />
                  {fetcher.data?.fieldErrors?.state ? (
                    <FormErrorMessage>
                      {fetcher.data?.fieldErrors?.state}
                    </FormErrorMessage>
                  ) : null}
                </FormControl>
              </HStack>
            </VStack>
          </fetcher.Form>
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
