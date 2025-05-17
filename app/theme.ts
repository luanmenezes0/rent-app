import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Figtree', sans-serif` },
        body: { value: `'Figtree', sans-serif` },
        global: {
          "html, body": {
            height: "100vh",
            fontFamily: "'Inter', sans-serif",
          },
          body: {
            display: "flex",
            flexDirection: "column",
          },
          "nav a": {
            color: "white",
          },
          "a.active": {
            color: "yellow.500",
          },
        },
      },
    },
  },
});
