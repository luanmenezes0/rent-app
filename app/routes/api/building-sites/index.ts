import { LoaderFunctionArgs } from "react-router";
import { getBuildingSitesByClientId } from "~/models/buildingSite.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const clientId = new URL(request.url).searchParams.get("clientId");

  if (!clientId) {
    return null;
  }
  const buildingSites = await getBuildingSitesByClientId(clientId);
  return buildingSites;
}
