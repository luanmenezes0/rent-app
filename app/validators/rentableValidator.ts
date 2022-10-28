import { withZod } from "@remix-validated-form/with-zod";
import * as z from "zod";

export const RentableSchema = z.object({
  name: z.string().min(1, "O Nome é obrigatório"),
  count: z.string().min(1, "A quantidade é obrigatória"),
});

export const rentableValidator = withZod(RentableSchema);
