import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { useThemeMode } from "../app/providers/ThemeModeProvider";
import { BrandMark } from "../features/auth/components/BrandMark";
import { getAccessToken } from "../shared/api/http";
import { getLanguageDisplayLabel, supportedLanguages } from "../shared/i18n/languages";

const featureIcons = [
  TodayRoundedIcon,
  MenuBookRoundedIcon,
  ShoppingCartRoundedIcon,
  SpaRoundedIcon,
  InsightsRoundedIcon,
  AutoAwesomeRoundedIcon
] as const;

export function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";
  const isAuthenticated = Boolean(getAccessToken());

  function handleLanguageChange(event: SelectChangeEvent): void {
    setLanguage(event.target.value as typeof language);
  }

  const featureKeys = [
    "landing.features.mealPlan",
    "landing.features.recipes",
    "landing.features.shopping",
    "landing.features.selfCare",
    "landing.features.metrics",
    "landing.features.ai"
  ] as const;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: isDark ? "#f7fafc" : "text.primary",
        background: isDark
          ? "linear-gradient(180deg, #07131c 0%, #0b1724 45%, #0f1a27 100%)"
          : "linear-gradient(180deg, #eef4f6 0%, #f8fbfc 48%, #eef5f3 100%)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(circle at 18% 12%, rgba(16,185,129,0.16), transparent 24%), radial-gradient(circle at 82% 22%, rgba(14,165,233,0.10), transparent 18%), radial-gradient(circle at 50% 84%, rgba(16,185,129,0.10), transparent 26%)"
            : "radial-gradient(circle at 16% 10%, rgba(16,185,129,0.10), transparent 20%), radial-gradient(circle at 82% 28%, rgba(14,165,233,0.06), transparent 18%), radial-gradient(circle at 50% 82%, rgba(16,185,129,0.06), transparent 24%)"
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: { xs: 2.5, md: 4 } }}>
        <Stack spacing={{ xs: 6, md: 8 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: { xs: 40, md: 52 },
                  height: { xs: 40, md: 52 },
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: isDark
                    ? "radial-gradient(circle at 35% 30%, rgba(71, 227, 163, 0.30), rgba(18, 47, 43, 0.65) 72%)"
                    : "radial-gradient(circle at 35% 30%, rgba(34, 197, 94, 0.18), rgba(15, 118, 110, 0.12) 72%)",
                  boxShadow: isDark ? "0 20px 50px rgba(16,185,129,0.18)" : "0 18px 38px rgba(15,118,110,0.12)"
                }}
              >
                <BrandMark />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  fontSize: { xs: "1.65rem", md: "2.35rem" }
                }}
              >
                SmartFoodPlan
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  px: 1.25,
                  py: 0.65,
                  borderRadius: 999,
                  backgroundColor: isDark ? "rgba(15,23,36,0.78)" : "rgba(255,255,255,0.78)",
                  border: "1px solid",
                  borderColor: "divider",
                  backdropFilter: "blur(10px)"
                }}
              >
                <LanguageRoundedIcon fontSize="small" color="action" />
                <Select
                  variant="standard"
                  disableUnderline
                  value={language}
                  onChange={handleLanguageChange}
                  size="small"
                  sx={{ minWidth: 70, fontSize: 13, fontWeight: 700, color: "inherit" }}
                >
                  {supportedLanguages.map((option) => (
                    <MenuItem key={option} value={option}>
                      {getLanguageDisplayLabel(option)}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <IconButton
                onClick={toggleMode}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: isDark ? "rgba(15,23,36,0.78)" : "rgba(255,255,255,0.78)"
                }}
              >
                {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
              <Button
                component={RouterLink}
                to={isAuthenticated ? "/meal-plan" : "/login"}
                variant="text"
                sx={{ fontWeight: 800, whiteSpace: "nowrap" }}
              >
                {isAuthenticated ? t("landing.actions.openApp") : t("landing.actions.signIn")}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 5, lg: 6 }} alignItems="center">
            <Stack spacing={3} sx={{ flex: 1.05, maxWidth: 700 }}>
              <Typography
                variant="overline"
                sx={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  color: "primary.main"
                }}
              >
                {t("landing.eyebrow")}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "2.5rem", md: "4.6rem" },
                  lineHeight: 0.95,
                  fontWeight: 950,
                  letterSpacing: "-0.06em",
                  maxWidth: 780
                }}
              >
                {t("landing.hero.title")}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: { xs: "1rem", md: "1.35rem" },
                  lineHeight: 1.7,
                  maxWidth: 640
                }}
              >
                {t("landing.hero.subtitle")}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
                <Button
                  component={RouterLink}
                  to={isAuthenticated ? "/meal-plan" : "/login"}
                  variant="contained"
                  endIcon={<ArrowOutwardRoundedIcon />}
                  sx={{
                    minHeight: 54,
                    px: 3.2,
                    borderRadius: 999,
                    fontSize: "1rem",
                    fontWeight: 900,
                    boxShadow: "0 16px 36px rgba(16,185,129,0.24)"
                  }}
                >
                  {t("landing.actions.primary")}
                </Button>
                <Button
                  component={RouterLink}
                  to={isAuthenticated ? "/self-care" : "/register"}
                  variant="outlined"
                  sx={{
                    minHeight: 54,
                    px: 3,
                    borderRadius: 999,
                    fontWeight: 800,
                    borderColor: "divider"
                  }}
                >
                  {t("landing.actions.secondary")}
                </Button>
              </Stack>

              <Stack spacing={1.25} sx={{ pt: 1 }}>
                {featureKeys.slice(0, 3).map((key, index) => {
                  const Icon = featureIcons[index];
                  return (
                    <Stack key={key} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box
                        sx={{
                          mt: 0.25,
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: isDark ? "rgba(19, 48, 46, 0.8)" : "rgba(16,185,129,0.10)",
                          color: "primary.main",
                          flexShrink: 0
                        }}
                      >
                        <Icon fontSize="small" />
                      </Box>
                      <Typography sx={{ fontSize: { xs: "0.98rem", md: "1.08rem" }, lineHeight: 1.6 }}>
                        {t(key)}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>

            <Box sx={{ flex: 0.95, width: "100%", maxWidth: 620 }}>
              <Paper
                sx={{
                  p: { xs: 1.25, md: 1.8 },
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                  background: isDark
                    ? "linear-gradient(180deg, rgba(10,18,31,0.98), rgba(15,24,37,0.98))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(246,250,251,0.96))",
                  boxShadow: isDark ? "0 32px 80px rgba(3,10,22,0.55)" : "0 28px 64px rgba(15,23,42,0.12)"
                }}
              >
                <Stack spacing={1.4}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={900}>
                      {t("landing.preview.title")}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.15,
                        py: 0.4,
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        color: "primary.main",
                        backgroundColor: "rgba(16,185,129,0.12)"
                      }}
                    >
                      {t("landing.preview.badge")}
                    </Box>
                  </Stack>

                  <Card
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: isDark
                        ? "linear-gradient(180deg, rgba(20,30,46,0.98), rgba(15,24,36,0.98))"
                        : "linear-gradient(180deg, rgba(245,249,250,1), rgba(255,255,255,1))"
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={900}>{t("landing.preview.mealPlanTitle")}</Typography>
                        <Typography color="text.secondary">{t("landing.preview.today")}</Typography>
                      </Stack>

                      <Stack direction="row" spacing={1.25}>
                        <Box
                          sx={{
                            width: 110,
                            minWidth: 110,
                            borderRadius: 3,
                            px: 1.5,
                            py: 1.75,
                            background: "linear-gradient(180deg, rgba(16,185,129,0.16), rgba(16,185,129,0.06))"
                          }}
                        >
                          <Typography color="text.secondary" sx={{ fontSize: 12 }}>{t("landing.preview.total")}</Typography>
                          <Typography sx={{ mt: 0.4, fontWeight: 900, fontSize: "1.55rem" }}>1680</Typography>
                          <Typography color="text.secondary" sx={{ fontSize: 12 }}>{t("landing.preview.kcal")}</Typography>
                        </Box> 

                        <Stack flex={1} spacing={1}>
                          {[
                            t("landing.preview.breakfast"),
                            t("landing.preview.lunch"),
                            t("landing.preview.selfCare")
                          ].map((label, index) => (
                            <Box
                              key={label}
                              sx={{
                                px: 1.4,
                                py: 1.15,
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: "divider",
                                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.86)"
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography fontWeight={800}>{label}</Typography>
                                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                                  {index === 0 ? "420 kcal" : index === 1 ? "610 kcal" : t("landing.preview.aiReady")}
                                </Typography>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    {featureKeys.slice(3).map((key, index) => {
                      const Icon = featureIcons[index + 3];
                      return (
                        <Card
                          key={key}
                          sx={{
                            flex: 1,
                            p: 1.6,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.92)"
                          }}
                        >
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: "rgba(16,185,129,0.12)",
                                color: "primary.main"
                              }}
                            >
                              <Icon fontSize="small" />
                            </Box>
                            <Typography sx={{ fontWeight: 800, lineHeight: 1.45 }}>{t(key)}</Typography>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Stack>

          <Paper
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background: isDark
                ? "linear-gradient(180deg, rgba(17,27,41,0.96), rgba(10,18,29,0.96))"
                : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(246,251,250,0.96))"
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.05em", mb: 0.75 }}>
                  {t("landing.cta.title")}
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
                  {t("landing.cta.subtitle")}
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to={isAuthenticated ? "/meal-plan" : "/login"}
                variant="contained"
                endIcon={<ArrowOutwardRoundedIcon />}
                sx={{ minHeight: 52, px: 3, borderRadius: 999, fontWeight: 900, whiteSpace: "nowrap" }}
              >
                {t("landing.actions.primary")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
