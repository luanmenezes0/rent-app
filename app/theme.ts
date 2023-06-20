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

// const customTheme = extendTheme(
//   {
//     colors: colors,
//     components: {
//       Text: {
//         baseStyle: (props) => ({
//           color: mode(
//             colors.primaryFontColor.lightMode,
//             colors.primaryFontColor.darkMode
//           )(props),
//         }),
//         variants: {
//           secondary: (props) => ({
//             color: mode(
//               colors.primaryFontColor.lightMode,
//               colors.primaryFontColor.darkMode
//             )(props),
//           }),
//         },
//       },
//     },

//     styles: {
//       global: (props) => ({
//         // Optionally set global CSS styles
//         body: {
//           color: mode(
//             colors.primaryFontColor.lightMode,
//             colors.primaryFontColor.darkMode
//           )(props),
//         },
//       }),
//     },
//   },
//   withDefaultColorScheme({ colorScheme: "teal" })
// );

export default extendTheme(
  theme,
  withDefaultColorScheme({ colorScheme: "teal" })
);
