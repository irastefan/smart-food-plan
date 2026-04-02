import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import {
  Box,
  Container,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent
} from "@mui/material";
import { Outlet } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { useThemeMode } from "../../app/providers/ThemeModeProvider";
import { BrandMark } from "../../features/auth/components/BrandMark";
import { getApiBaseUrl } from "../../shared/config/env";
import { getLanguageDisplayLabel, supportedLanguages } from "../../shared/i18n/languages";

export function AuthLayout() {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";

  function handleLanguageChange(event: SelectChangeEvent): void {
    setLanguage(event.target.value as typeof language);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, #09121d 0%, #0d1724 52%, #0f1c2b 100%)"
          : "linear-gradient(90deg, rgba(231,241,243,0.95) 0%, rgba(231,241,243,0.92) 46%, rgba(248,239,236,0.95) 100%)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(circle at 18% 22%, rgba(16,185,129,0.10), transparent 22%), radial-gradient(circle at 82% 16%, rgba(14,165,233,0.07), transparent 18%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.06), transparent 24%)"
            : "radial-gradient(circle at 20% 20%, rgba(31,181,122,0.08), transparent 28%), radial-gradient(circle at 80% 80%, rgba(32,42,54,0.06), transparent 22%)"
        }}
      />

      <Container
        maxWidth={false}
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 }
        }}
      >
        <Stack spacing={4} sx={{ minHeight: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <BrandMark />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: isDark ? "rgba(15, 23, 36, 0.78)" : "rgba(255,255,255,0.62)",
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
                  sx={{
                    minWidth: 72,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "text.primary"
                  }}
                >
                  {supportedLanguages.map((languageOption) => (
                    <MenuItem key={languageOption} value={languageOption}>
                      {getLanguageDisplayLabel(languageOption)}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <IconButton
                size="small"
                onClick={toggleMode}
                title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: isDark ? "rgba(15, 23, 36, 0.78)" : "rgba(255,255,255,0.62)"
                }}
              >
                {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
              <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ display: { xs: "none", sm: "block" } }}>
                {t("layout.help")}
              </Typography>
              <IconButton size="small">
                <HelpOutlineRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <SettingsRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <Stack
            flex={1}
            justifyContent="center"
            alignItems="center"
            sx={{
              py: { xs: 2, md: 4 },
              px: { md: 0 }
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 560,
                minHeight: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 0,
                border: "none",
                background: "transparent",
                boxShadow: "none"
              }}
            >
              <Outlet />
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            {t("layout.backend")}: {getApiBaseUrl()} · {isDark ? t("theme.dark") : t("theme.light")} ·{" "}
            {t(`language.${language}` as never)}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
