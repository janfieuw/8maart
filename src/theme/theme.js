import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",

    // 👇 primaire kleur blijft bestaan voor systeemgebruik
    primary: {
      main: "#31995c",
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "none",
          borderRadius: "10px",
        },

        contained: {
          backgroundColor: "#efe9d7",
          color: "#1f2937",

          "&:hover": {
            backgroundColor: "#e4dcc6",
            boxShadow: "none",
          },
        },
      },
    },
  },
});