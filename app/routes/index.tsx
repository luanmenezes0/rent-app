import type { LoaderArgs } from "@remix-run/server-runtime";
import Header from "~/components/Header";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request);
  return null;
}

export default function Index() {
  return (
    <>
      <Header />
      <main className="flex h-full flex-col gap-4 p-8"></main>
    </>
  );
}
