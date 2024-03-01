import { Container, Heading } from "@chakra-ui/react";
import { useLoaderData } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";

import Header from "~/components/Header";
import { prisma } from "~/db.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const users = await prisma.user.findMany();

  return { users };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);

  const formData = await request.formData();

  const action = formData.get("_action");

  switch (action) {
    default:
      throw new Error("Invalid action");
  }
}

export default function Index() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <Container as="main" maxW="container.xl" py="50" display="grid" gap="7">
        <Heading as="h1" size="2xl">
          Users
        </Heading>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </Container>
    </>
  );
}
