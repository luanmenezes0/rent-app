import { withEmotionCache } from "@emotion/react";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/timezone.js";
import timezone from "dayjs/plugin/utc.js";
import { ThemeProvider } from "next-themes";

import { ChakraProvider } from "./components/chakra-provider";
import { useInjectStyles } from "./emotion/emotion-client";

import styles from "~/styles/index.css";
import { getUser } from "./session.server";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("America/Fortaleza");

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    user: await getUser(request),
  });
}

interface LayoutProps extends React.PropsWithChildren {
  title?: string;
}

export const Layout = withEmotionCache((props: LayoutProps, cache) => {
  const { children, title = "Rent App" } = props;

  useInjectStyles(cache);

  return (
    <html lang="en">
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <title>{title}</title>
        <Links />
        <meta
          name="emotion-insertion-point"
          content="emotion-insertion-point"
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
});

export default function App() {
  // throw new Error("💣💥 Booooom");
  return (
    <ChakraProvider>
      <ThemeProvider disableTransitionOnChange attribute="class">
        <Outlet />
      </ThemeProvider>
    </ChakraProvider>
  );
}

export { ErrorBoundary } from "~/components/ErrorBoundary";
