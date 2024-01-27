import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useSearchParams,
  type V2_MetaFunction,
} from "@remix-run/react";

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

export const meta: V2_MetaFunction = () => {
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
      bgColor={useColorModeValue("gray.100", "gray.700")}
    >
      <Form method="POST" style={{ width: "380px" }}>
        <VStack
          spacing="4"
          maxW="container.md"
          p="6"
          bgColor={useColorModeValue("white", "gray.800")}
          borderRadius="lg"
        >
          <FormControl isInvalid={Boolean(actionData?.fieldErrors?.email)}>
            <FormLabel htmlFor="email">E-mail</FormLabel>
            <Input
              id="email"
              required
              autoFocus
              name="email"
              type="email"
              autoComplete="email"
            />
            <FormErrorMessage>{actionData?.fieldErrors.email}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={Boolean(actionData?.fieldErrors?.password)}>
            <FormLabel htmlFor="password">Senha</FormLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
            <FormErrorMessage>
              {actionData?.fieldErrors.password}
            </FormErrorMessage>
          </FormControl>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button w="full" type="submit">
            Entrar
          </Button>
        </VStack>
      </Form>
    </Flex>
  );
}
