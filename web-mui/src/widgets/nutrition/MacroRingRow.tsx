import { Box, CircularProgress, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";

export type MacroRingItem = {
  key: string;
  label: string;
  value: number;
  color: string;
  target?: number;
  footer?: string;
};

type MacroRingRowProps = {
  items: MacroRingItem[];
  variant?: "dashboard" | "detail";
};

function formatNumber(value: number): string {
  return String(Math.round(value));
}

export function MacroRingRow({ items, variant = "dashboard" }: MacroRingRowProps) {
  const theme = useTheme();
  const { t } = useLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDashboard = variant === "dashboard";
  const ringSize = isDashboard ? (isMobile ? 87 : 104) : isMobile ? 76 : 96;

  return (
    <Stack
      direction="row"
      spacing={{ xs: isDashboard ? 0.9 : 1.1, sm: 2 }}
      alignItems="stretch"
      justifyContent="space-between"
      sx={{ px: { xs: isDashboard ? 0.35 : 0, sm: 0 } }}
    >
      {items.map((item) => (
        <Box
          key={item.key}
          sx={{
            flex: 1,
            minWidth: 0,
            px: { xs: isDashboard ? 0.1 : 0.2, sm: isDashboard ? 1.5 : 0.5 },
            py: { xs: 0.15, sm: isDashboard ? 1 : 0.4 }
          }}
        >
          <Typography
            fontWeight={700}
            textAlign="center"
            sx={{
              color: item.color,
              mb: { xs: 0.5, sm: 0.8 },
              fontSize: {
                xs: isDashboard ? "0.96rem" : "0.9rem",
                sm: isDashboard ? "0.96rem" : "1rem"
              }
            }}
          >
            {item.label}
          </Typography>

          <Stack alignItems="center" spacing={{ xs: 0.55, sm: 1.15 }}>
            <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={ringSize}
                thickness={3}
                sx={{
                  color: (paletteTheme) =>
                    paletteTheme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)"
                }}
              />
              <CircularProgress
                variant="determinate"
                value={Math.min(100, item.target && item.target > 0 ? (item.value / item.target) * 100 : 100)}
                size={ringSize}
                thickness={3}
                sx={{
                  color: item.color,
                  position: "absolute",
                  insetInlineStart: 0,
                  "& .MuiCircularProgress-circle": {
                    strokeLinecap: "round"
                  }
                }}
              />
              <Box
                sx={{
                  inset: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Box textAlign="center">
                  <Typography
                    fontWeight={800}
                    lineHeight={1}
                    sx={{
                      fontSize: {
                        xs: isDashboard ? "1.18rem" : "1.08rem",
                        sm: isDashboard ? "1.42rem" : "1.34rem"
                      }
                    }}
                  >
                    {formatNumber(item.value)}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: {
                        xs: isDashboard ? "0.76rem" : "0.7rem",
                        sm: isDashboard ? "0.74rem" : "0.76rem"
                      }
                    }}
                  >
                    {item.target ? `/${formatNumber(item.target)}${t("units.short.g" as never)}` : t("units.short.g" as never)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography
              color="text.secondary"
              textAlign="center"
              sx={{
                minHeight: { xs: 18, sm: 20 },
                fontSize: {
                  xs: isDashboard ? "0.82rem" : "0.74rem",
                  sm: isDashboard ? "0.78rem" : "0.8rem"
                }
              }}
            >
              {item.footer ?? ""}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
