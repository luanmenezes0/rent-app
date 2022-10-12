import * as z from "zod";

type InferSafeParseErrors<T extends z.ZodType<any, any, any>, U = string> = {
  formErrors: U[];
  fieldErrors: {
    [P in keyof z.infer<T>]?: U[];
  };
};

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1),
});

export type ClientFields = z.infer<typeof createClientSchema>;
export type ClientFieldsErrors = InferSafeParseErrors<typeof createClientSchema>;


