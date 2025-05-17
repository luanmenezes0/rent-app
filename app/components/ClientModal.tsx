import {
  Button,
  Dialog,
  Field,
  HStack,
  Input,
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
    <Dialog.Root size="xl" isOpen onClose={onClose}>
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>
              {editionMode ? "Editar" : "Criar"} Cliente
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <fetcher.Form method="PUT" id="client-form">
              <Field.Root as="fieldset">
                <Field.Label as="legend">Pessoa Jurídica</Field.Label>
                <RadioGroup.Root
                  name="isLegalEntity"
                  defaultValue={
                    editionMode ? values?.isLegalEntity.toString() : "false"
                  }
                  onChange={(value) =>
                    value === "true" ? setLabel("CNPJ") : setLabel("CPF")
                  }
                >
                  <HStack spacing={4}>
                    <RadioGroup.Item value="true">
                      {" "}
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>Sim</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <Radio value="false" defaultChecked>
                      Não
                    </Radio>
                  </HStack>
                </RadioGroup.Root>
              </Field.Root>

              <Field.Root
                isInvalid={Boolean(
                  fetcher.data?.fieldErrors?.registrationNumber,
                )}
              >
                <Field.Label htmlFor="registrationNumber">{label}</Field.Label>
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
                  <Field.ErrorText>
                    {fetcher.data?.fieldErrors?.registrationNumber}
                  </Field.ErrorText>
                ) : null}
              </Field.Root>
              <VStack spacing={2}>
                <input type="hidden" name="id" defaultValue={values?.id} />
                <Field.Root
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.name)}
                >
                  <Field.Label htmlFor="name">Nome</Field.Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={values?.name}
                  />
                  {fetcher.data?.fieldErrors?.name ? (
                    <Field.ErrorText>
                      {fetcher.data?.fieldErrors?.name}
                    </Field.ErrorText>
                  ) : null}
                </Field.Root>
                <Field.Root
                  isInvalid={Boolean(fetcher.data?.fieldErrors?.address)}
                >
                  <Field.Label htmlFor="address">Endereço</Field.Label>
                  <Input
                    id="address"
                    name="address"
                    required
                    defaultValue={values?.address}
                  />
                  {fetcher.data?.fieldErrors?.address ? (
                    <Field.ErrorText>
                      {fetcher.data?.fieldErrors?.address}
                    </Field.ErrorText>
                  ) : null}
                </Field.Root>
                <HStack>
                  <Field.Root
                    isInvalid={Boolean(fetcher.data?.fieldErrors?.neighborhood)}
                  >
                    <Field.Label htmlFor="neighborhood">Bairro</Field.Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      required
                      defaultValue={values?.neighborhood}
                    />
                    {fetcher.data?.fieldErrors?.neighborhood ? (
                      <Field.ErrorText>
                        {fetcher.data?.fieldErrors?.neighborhood}
                      </Field.ErrorText>
                    ) : null}
                  </Field.Root>

                  <Field.Root
                    isInvalid={Boolean(fetcher.data?.fieldErrors?.city)}
                  >
                    <Field.Label htmlFor="city">Cidade</Field.Label>
                    <Input
                      id="city"
                      name="city"
                      required
                      defaultValue={values?.city ?? ""}
                    />
                    {fetcher.data?.fieldErrors?.city ? (
                      <Field.ErrorText>
                        {fetcher.data?.fieldErrors?.city}
                      </Field.ErrorText>
                    ) : null}
                  </Field.Root>
                </HStack>
                <HStack>
                  <Field.Root
                    isInvalid={Boolean(fetcher.data?.fieldErrors?.phoneNumber)}
                  >
                    <Field.Label htmlFor="phoneNumber">Telefone</Field.Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      defaultValue={values?.phoneNumber ?? ""}
                      minLength={10}
                      required
                      type="tel"
                    />
                    {fetcher.data?.fieldErrors?.phoneNumber ? (
                      <Field.ErrorText>
                        {fetcher.data?.fieldErrors?.phoneNumber}
                      </Field.ErrorText>
                    ) : null}
                  </Field.Root>

                  <Field.Root
                    isInvalid={Boolean(fetcher.data?.fieldErrors?.state)}
                  >
                    <Field.Label htmlFor="state">UF</Field.Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={values?.state ?? ""}
                      required
                    />
                    {fetcher.data?.fieldErrors?.state ? (
                      <Field.ErrorText>
                        {fetcher.data?.fieldErrors?.state}
                      </Field.ErrorText>
                    ) : null}
                  </Field.Root>
                </HStack>
              </VStack>
            </fetcher.Form>
          </Dialog.Body>
          <Dialog.Footer>
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
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
