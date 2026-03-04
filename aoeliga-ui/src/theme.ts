import type { MantineThemeOverride } from "@mantine/core";

export const theme: MantineThemeOverride = {
  primaryColor: "gold",
  defaultRadius: "lg",

  components: {
    Card: {
      defaultProps: {
        radius: "lg",
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: "rgba(229,154,42,0.25)",
          backgroundColor: "rgba(21,31,40,0.55)",
          backdropFilter: "blur(6px)",
        },
      },
    },
    NavLink: {
      styles: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },

  colors: {
    dark: [
      "#F2F4F8",
      "#DDE2EA",
      "#B7C0CF",
      "#8E9AB0",
      "#66738A",
      "#465066",
      "#2F3748",
      "#232B39",
      "#1A2230",
      "#151F28",
    ],
    gold: [
      "#FFF7E6",
      "#FFE9BF",
      "#FFD48A",
      "#FFBF54",
      "#F3A936",
      "#E59A2A",
      "#D48C22",
      "#C27D1A",
      "#B06F12",
      "#9A600B",
    ],
    redleague: [
      "#FFE9EC",
      "#FFC9D1",
      "#FF96A3",
      "#FF6073",
      "#FF3A4F",
      "#F7253D",
      "#D61E32",
      "#B81728",
      "#9B121F",
      "#7F0D18",
    ],
  },
};