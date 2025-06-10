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
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import {
  Form,
  useActionData,
  useSearchParams,
  type MetaFunction,
} from "react-router";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { parseZodError, safeRedirect, validationError } from "~/utils";
import { LoginSchema } from "~/validators/userValidator";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/notes");

  const result = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (result.error) {
    return validationError(parseZodError(result.error));
  }

  const user = await verifyLogin(result.data.email, result.data.password);

  if (!user) {
    return validationError({
      email: "Email ou senha incorretos.",
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
