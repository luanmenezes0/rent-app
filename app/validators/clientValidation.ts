import { withZod } from "@remix-validated-form/with-zod";
import * as z from "zod";

export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O Nome é obrigatório"),
  address: z.string().min(1, "O Endereço é obrigatório"),
  phoneNumber: z.string().min(1, "O Telefone é obrigatório"),
  isLegalEntity: z.string(),
  registrationNumber: z.string().min(1, "O CPF/CNPJ é obrigatório"),
  state: z.string().min(1, "O Estado é obrigatório"),
  city: z.string().min(1, "A Cidade é obrigatória"),
  neighborhood: z.string().min(1, "O Bairro é obrigatório"),
  zipCode: z.string().optional(),
  email: z.string().email().optional(),
  streetCode: z.string().optional(),
});

export const clientValidator = withZod(ClientSchema);
