import { withZod } from "@remix-validated-form/with-zod";
import * as z from "zod";

import { userRoles } from "~/utils";

export const LoginSchema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(8, "A senha deve conter no mínimo 8 caracteres"),
});

export const loginValidator = withZod(LoginSchema);

export const UserSchema = z.object({
  userId: z.string().min(1, "O userId é obrigatório"),
  role: z.enum([userRoles.USER, userRoles.ADMIN]),
});

export const userValidator = withZod(UserSchema);
