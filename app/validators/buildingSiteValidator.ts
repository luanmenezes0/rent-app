import { withZod } from "@remix-validated-form/with-zod";
import * as z from "zod";

export const BuildingSiteSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O Nome é obrigatório"),
  address: z.string().min(1, "O Endereço é obrigatório"),
  clientId: z.string(),
});

export const buildingSiteValidator = withZod(BuildingSiteSchema);
