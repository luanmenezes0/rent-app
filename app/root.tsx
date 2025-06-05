import { ChakraProvider } from "@chakra-ui/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

import styles from "~/styles/index.css?url";

import { getUser } from "./session.server";
import theme from "./theme";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("America/Fortaleza");

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request }: LoaderFunctionArgs) {
  return {
    user: await getUser(request),
  };
}

function Document({
  children,
  title = "Rent App",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // throw new Error("💣💥 Booooom");

  return (
    <Document>
      <ChakraProvider theme={theme}>
        <Outlet />
      </ChakraProvider>
    </Document>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
