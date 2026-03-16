import { createTheme, type PaletteMode } from "@mui/material";

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#10b981",
        dark: "#047857",
        light: "#6ee7b7",
        contrastText: "#f8fbfa"
      },
      secondary: {
        main: "#7c3aed"
      },
      info: {
        main: "#0ea5e9"
      },
      success: {
        main: "#22c55e"
      },
      warning: {
        main: "#f59e0b"
      },
      error: {
        main: "#ef4444"
      },
      background: {
        default: isDark ? "#0d1724" : "#f3f6f7",
        paper: isDark ? "#141f2d" : "#ffffff"
      },
      text: {
        primary: isDark ? "#f8fafc" : "#1c2430",
        secondary: isDark ? "#9aa9bc" : "#667085"
      },
      divider: isDark ? "rgba(148, 163, 184, 0.10)" : "rgba(26, 36, 48, 0.08)"
    },
    shape: {
      borderRadius: 12
    },
    typography: {
      fontFamily: "\"Manrope\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
      h3: {
        fontWeight: 800,
        letterSpacing: "-0.04em"
      },
      h4: {
        fontWeight: 800,
        letterSpacing: "-0.03em"
      },
      h5: {
        fontWeight: 750,
        letterSpacing: "-0.02em"
      },
      button: {
        textTransform: "none",
        fontWeight: 700
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none"
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            minHeight: 52,
            borderRadius: 12
          },
          containedPrimary: {
            boxShadow: isDark ? "0 10px 30px rgba(16, 185, 129, 0.22)" : "none"
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          fullWidth: true,
          variant: "outlined"
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(11, 20, 32, 0.92)" : "#ffffff",
            color: isDark ? "#f8fafc" : undefined,
            "& fieldset": {
              borderColor: isDark ? "rgba(148, 163, 184, 0.12)" : undefined
            },
            "&:hover fieldset": {
              borderColor: isDark ? "rgba(148, 163, 184, 0.22)" : undefined
            },
            "&.Mui-focused fieldset": {
              borderColor: isDark ? "#10b981" : undefined
            }
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? "#94a3b8" : undefined
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: isDark ? "#e2e8f0" : undefined
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12
          }
        }
      }
    }
  });
}
