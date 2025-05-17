import { Button, Field, Flex, Heading, Input, VStack } from "@chakra-ui/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  type MetaFunction,
} from "@remix-run/react";
import { validationError } from "remix-validated-form";
import { useTheme } from "src/components/ui/color-mode";

import { createUser, getUserByEmail, verifyToken } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";
import { loginValidator } from "~/validators/userValidator";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const token = formData.get("token");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  if (!token) {
    return validationError({ fieldErrors: { token: "Token inválido" } });
  }

  const tokenIsValid = await verifyToken(decodeURIComponent(token.toString()));
  if (!tokenIsValid) {
    return validationError({
      fieldErrors: { token: "Token inválido" },
    });
  }

  const result = await loginValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { email, password } = result.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return validationError(
      {
        fieldErrors: { email: "E-mail já cadastrado." },
      },
      { email },
    );
  }

  const user = await createUser(email, password);

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return [
    {
      title: "Sign Up",
    },
  ];
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();

  const token = searchParams.get("token");

  return (
    <Flex
      h="full"
      justifyContent="center"
      alignItems="center"
      bgColor={useTheme("gray.100", "gray.700")}
    >
      <Form method="POST" style={{ width: "380px" }}>
        <VStack
          spacing="4"
          maxW="container.md"
          p="6"
          bgColor={useTheme("white", "gray.800")}
          borderRadius="lg"
        >
          <Heading fontSize="20">Primeiro acesso</Heading>
          <Field.Root isInvalid={Boolean(actionData?.fieldErrors?.email)}>
            <Field.Label htmlFor="email">E-mail</Field.Label>
            <Input
              id="email"
              required
              name="email"
              type="email"
              autoComplete="email"
            />
            <Field.ErrorText>{actionData?.fieldErrors.email}</Field.ErrorText>
          </Field.Root>
          <Field.Root isInvalid={Boolean(actionData?.fieldErrors?.password)}>
            <Field.Label htmlFor="password">Senha</Field.Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
            <Field.ErrorText>
              {actionData?.fieldErrors.password}
            </Field.ErrorText>
          </Field.Root>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          {token ? <input type="hidden" name="token" value={token} /> : null}
          <Button w="full" type="submit">
            Criar conta
          </Button>
          <div>
            <span>Já tem uma conta? </span>
            <Link
              to={{
                pathname: "/login",
                search: searchParams.toString(),
              }}
            >
              Entrar
            </Link>
          </div>
        </VStack>
      </Form>
    </Flex>
  );
}
