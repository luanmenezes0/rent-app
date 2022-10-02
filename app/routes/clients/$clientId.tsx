import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import Header from "~/components/Header";
import { getClient } from "~/models/client.server";

import { deleteNote } from "~/models/note.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
  await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  const client = await getClient(params.clientId);
  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ client });
}

export async function action({ request, params }: ActionArgs) {
  const userId = await requireUserId(request);
  invariant(params.clientId, "clientId not found");

  await deleteNote({ userId, id: params.clientId });

  return redirect("/clients");
}

export default function Client() {
  const { client } = useLoaderData<typeof loader>();

  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8">
        <h3 className="text-2xl font-bold">{client.name}</h3>
        <p className="py-6">{client.address}</p>
        <hr className="my-4" />
        <Form method="post">
          <button
            type="submit"
            className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Delete
          </button>
        </Form>
      </main>
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Cliente não encontrado</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}



