import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";

import { Button, Label, TextInput } from "flowbite-react";
import { validationError } from "remix-validated-form";
import FormFieldError from "~/components/FormFieldError";
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
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
          <div>
            <Label htmlFor="email" value="E-mail" />
            <TextInput
              id="email"
              required
              autoFocus={true}
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={actionData?.fieldErrors?.email ? true : undefined}
              aria-describedby="email-error"
            />
            {actionData?.fieldErrors?.email && (
              <FormFieldError>{actionData.fieldErrors.email}</FormFieldError>
            )}
          </div>
          <div>
            <Label htmlFor="password" value="Senha" />
            <TextInput
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
              <FormFieldError>{actionData.fieldErrors.password}</FormFieldError>
            )}
          </div>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button type="submit">Entrar</Button>

          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Ainda não tem uma conta?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/join",
                  search: searchParams.toString(),
                }}
              >
                Cadastre-se
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
