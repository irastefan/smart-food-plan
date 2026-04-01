import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  type SelectChangeEvent,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { useThemeMode } from "../../app/providers/ThemeModeProvider";

type DashboardTopbarProps = {
  onOpenSidebar: () => void;
  title?: string;
  subtitle?: string;
};

export function DashboardTopbar({ onOpenSidebar }: DashboardTopbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isDark = mode === "dark";
  void onOpenSidebar;

  if (isMobile) {
    return null;
  }

  function handleLanguageChange(event: SelectChangeEvent): void {
    setLanguage(event.target.value as "en" | "ru");
  }

  return (
    <Stack>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={{ xs: 0.75, md: 1.25 }} alignItems="center" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              display: { xs: "none", lg: "flex" },
              px: { xs: 1, md: 1.25 },
              py: 0.75,
              borderRadius: 999,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: isDark ? "rgba(20,31,45,0.94)" : "#ffffff"
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
                minWidth: { xs: 44, md: 56 },
                fontSize: 13,
                fontWeight: 700,
                color: "text.primary"
              }}
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ru">RU</MenuItem>
            </Select>
          </Stack>

          <IconButton
            size="small"
            onClick={toggleMode}
            title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: isDark ? "rgba(20,31,45,0.94)" : "#ffffff"
            }}
          >
            {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
          </IconButton>

          <IconButton>
            <NotificationsRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
