import { extendTheme, withDefaultColorScheme } from "@chakra-ui/react";

const theme = {
  styles: {
    global: {
      "html, body": {
        height: "100vh",
      },
      body: {
        display: "flex",
      },
    },
  },
};

export default extendTheme(
  theme,
  withDefaultColorScheme({ colorScheme: "teal" })
);
