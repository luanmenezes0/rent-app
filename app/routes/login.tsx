import {
  Button,
  Field,
  Flex,

  Input,
  VStack,
} from "@chakra-ui/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useSearchParams,
  type MetaFunction,
} from "@remix-run/react";
import { useTheme } from "next-themes";
import { validationError } from "remix-validated-form";

import { verifyLogin } from "~/models/user.server";
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
  return [
    {
      title: "Login",
    },
  ];
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const actionData = useActionData<typeof action>();



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
              autoComplete="current-password"
            />
            <Field.ErrorText>
              {actionData?.fieldErrors.password}
            </Field.ErrorText>
          </Field.Root>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button w="full" type="submit">
            Entrar
          </Button>
        </VStack>
      </Form>
    </Flex>
  );
}
