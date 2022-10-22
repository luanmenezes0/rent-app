import { withZod } from "@remix-validated-form/with-zod";
import * as z from "zod";

export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O Nome é obrigatório"),
  address: z.string().min(1, "O Endereço é obrigatório"),
  phoneNumber: z.string().min(1, "O Telefone é obrigatório"),
  isLegalEntity: z.string(),
  registrationNumber: z.string().min(1, "O CPF/CNPJ é obrigatório"),
});

export const clientValidator = withZod(ClientSchema);
