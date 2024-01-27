import { ChakraProvider } from "@chakra-ui/react";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "~/styles/index.css";
import { getUser } from "./session.server";
import theme from "./theme";

export const links = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
  });
}

function Document({
  children,
  title = "App title",
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
        <LiveReload />
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
