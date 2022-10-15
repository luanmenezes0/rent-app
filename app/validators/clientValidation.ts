import * as z from "zod";

type InferSafeParseErrors<T extends z.ZodType<any, any, any>, U = string> = {
  formErrors: U[];
  fieldErrors: {
    [P in keyof z.infer<T>]?: U[];
  };
};

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O Nome é obrigatório"),
  address: z.string().min(1, "O Endereço é obrigatório"),
  phoneNumber: z.string().min(1, "O Telefone é obrigatório"),
  isLegalEntity: z.string(),
  registrationNumber: z.string().optional(),
});

export type ClientFields = z.infer<typeof clientSchema>;
export type ClientFieldsErrors = InferSafeParseErrors<
  typeof clientSchema
>;
