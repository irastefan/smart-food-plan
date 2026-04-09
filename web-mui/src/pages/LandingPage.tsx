import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import {
  Box,
  Button,
  Container,
  IconButton,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { useThemeMode } from "../app/providers/ThemeModeProvider";
import wellinMobilePreview from "../assets/wellin-mobile-preview.jpg";
import { getAccessToken } from "../shared/api/http";
import { getLanguageDisplayLabel, supportedLanguages } from "../shared/i18n/languages";
import { WellinLogoMark } from "../shared/ui/WellinLogoMark";

const featureIcons = [RestaurantMenuRoundedIcon, SpaRoundedIcon, MonitorHeartRoundedIcon] as const;

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
    "landing.features.selfCare",
    "landing.features.metrics"
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
                  width: { xs: 52, md: 82 },
                  height: { xs: 52, md: 82 },
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <WellinLogoMark size="100%" />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  fontSize: { xs: "2rem", md: "3.35rem" }
                }}
              >
                Wellin
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
                sx={{ fontWeight: 800, whiteSpace: "nowrap", display: { xs: "none", sm: "inline-flex" } }}
              >
                {isAuthenticated ? t("landing.actions.openApp") : t("landing.actions.signIn")}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 4, lg: 6 }} alignItems="center">
            <Stack spacing={3} sx={{ flex: 1.05, maxWidth: 700, order: { xs: 1, lg: 1 } }}>
              <Typography
                sx={{
                  fontSize: { xs: "2.65rem", md: "4.8rem" },
                  lineHeight: 0.98,
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
                  to={isAuthenticated ? "/meal-plan" : "/register"}
                  variant="contained"
                  endIcon={<ArrowOutwardRoundedIcon />}
                  sx={{
                    minHeight: 54,
                    px: 3.2,
                    borderRadius: 999,
                    fontSize: "1rem",
                    fontWeight: 900,
                    boxShadow: "0 16px 36px rgba(16,185,129,0.24)",
                    alignSelf: { xs: "stretch", sm: "flex-start" }
                  }}
                >
                  {t("landing.actions.primary")}
                </Button>
                <Button
                  component={RouterLink}
                  to={isAuthenticated ? "/self-care" : "/login"}
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

              <List disablePadding sx={{ pt: 1, order: { xs: 3, lg: 3 } }}>
                {featureKeys.map((key, index) => {
                  const Icon = featureIcons[index];
                  return (
                    <ListItem key={key} disableGutters sx={{ py: 1, alignItems: "flex-start" }}>
                      <ListItemIcon sx={{ minWidth: 58, pt: 0.3 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            background: isDark ? "rgba(19, 48, 46, 0.8)" : "rgba(16,185,129,0.10)",
                            color: "primary.main"
                          }}
                        >
                          <Icon fontSize="small" />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: { xs: "1.15rem", md: "1.45rem" }, fontWeight: 900, mb: 0.5 }}>
                            {t(`landing.featureTitles.${index}` as never)}
                          </Typography>
                        }
                        secondary={
                          <Typography color="text.secondary" sx={{ fontSize: { xs: "0.98rem", md: "1.08rem" }, lineHeight: 1.6 }}>
                            {t(key)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Stack>

            <Box
              sx={{
                flex: 0.95,
                width: "100%",
                maxWidth: 620,
                display: "grid",
                placeItems: "center",
                order: { xs: 2, lg: 2 },
                mt: { xs: -0.5, lg: 0 }
              }}
            >
              <Paper
                sx={{
                  p: { xs: 0.8, md: 1.1 },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                  background: isDark
                    ? "linear-gradient(180deg, rgba(10,18,31,0.98), rgba(15,24,37,0.98))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(246,250,251,0.96))",
                  boxShadow: isDark ? "0 40px 100px rgba(3,10,22,0.55)" : "0 28px 64px rgba(15,23,42,0.12)",
                  transform: "none",
                  width: { xs: 260, sm: 300, md: 330 }
                }}
              >
                <Box
                  component="img"
                  src={wellinMobilePreview}
                  alt="Wellin mobile preview"
                  sx={{
                    display: "block",
                    width: "100%",
                    borderRadius: 2.5
                  }}
                />
              </Paper>
            </Box>
          </Stack>

          <Paper
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 2.5,
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
                to={isAuthenticated ? "/meal-plan" : "/register"}
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
