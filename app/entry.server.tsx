import { PassThrough } from "stream";

import createEmotionCache from "@emotion/cache";
import { CacheProvider as EmotionCacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import {
  createReadableStreamFromReadable,
  type EntryContext,
} from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import isbot from "isbot";
import { renderToPipeableStream } from "react-dom/server";

export const streamTimeout = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const callbackMethod = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    let didError = false;

    const emotionCache = createEmotionCache({ key: "css" });

    const { pipe, abort } = renderToPipeableStream(
      <EmotionCacheProvider value={emotionCache}>
        <RemixServer context={remixContext} url={request.url} />
      </EmotionCacheProvider>,
      {
        [callbackMethod]() {
          const reactBody = new PassThrough();
          const emotionServer = createEmotionServer(emotionCache);

          const bodyWithStyles = emotionServer.renderStylesToNodeStream();
          reactBody.pipe(bodyWithStyles);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            // @ts-expect-error - Remix types are incorrect?
            new Response(createReadableStreamFromReadable(bodyWithStyles), {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          );

          pipe(reactBody);
        },
        onShellError: (err: unknown) => {
          reject(err);
        },
        onError: (error: unknown) => {
          didError = true;

          console.error(error);
        },
      },
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
