import { extendTheme, withDefaultColorScheme } from "@chakra-ui/react";

// 2. Objects can be created inside the extendTheme function or elsewhere and imported
// const colors = {
//   primaryFontColor: {
//     lightMode: baseTheme.colors.gray["700"],
//     darkMode: baseTheme.colors.gray["200"],
//   },
//   secondaryFontColor: {
//     lightMode: baseTheme.colors.gray["600"],
//     darkMode: baseTheme.colors.gray["400"],
//   },
//   plainOldBlue: "blue",
// };

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
      'nav a': {
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
