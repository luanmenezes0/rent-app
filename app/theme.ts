import { extendTheme, withDefaultColorScheme } from "@chakra-ui/react";

const theme = {
  styles: {
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
};

export default extendTheme(
  theme,
  withDefaultColorScheme({ colorScheme: "pink" }),
);
