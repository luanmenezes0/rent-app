import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";

import { validationError } from "remix-validated-form";
import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";
import { loginValidator } from "~/validators/userValidator";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/notes");

  const result = await loginValidator.validate(formData);

  if (result.error) {
    return validationError(result.error);
  }

  const user = await verifyLogin(result.data.email, result.data.password);

  if (!user) {
    return validationError({
      fieldErrors: { email: "Email ou senha incorretos." },
    });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const actionData = useActionData<typeof action>();

  return (
    <Container alignSelf="center">
      <Form method="post">
        <VStack w="96" spacing="4">
          <FormControl>
            <FormLabel htmlFor="email">E-mail</FormLabel>
            <Input
              id="email"
              required
              autoFocus
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={actionData?.fieldErrors?.email ? true : undefined}
              aria-describedby="email-error"
            />
            {actionData?.fieldErrors?.email && (
              <FormErrorMessage>
                {actionData.fieldErrors.email}
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">Senha</FormLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={
                actionData?.fieldErrors?.password ? true : undefined
              }
              aria-describedby="password-error"
            />
            {actionData?.fieldErrors?.password && (
              <FormErrorMessage>
                {actionData.fieldErrors.password}
              </FormErrorMessage>
            )}
          </FormControl>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button w="96" type="submit">
            Entrar
          </Button>
          <div>
            Ainda não tem uma conta?{" "}
            <Link
              to={{
                pathname: "/join",
                search: searchParams.toString(),
              }}
            >
              Cadastre-se
            </Link>
          </div>
        </VStack>
      </Form>
    </Container>
  );
}
