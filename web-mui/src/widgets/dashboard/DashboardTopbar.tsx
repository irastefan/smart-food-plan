import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Avatar,
  Box,
  IconButton,
  InputBase,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent
} from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { useThemeMode } from "../../app/providers/ThemeModeProvider";
import { useDashboardUser } from "./useDashboardUser";

type DashboardTopbarProps = {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
};

export function DashboardTopbar({ onOpenSidebar, title, subtitle }: DashboardTopbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";
  const user = useDashboardUser();

  function handleLanguageChange(event: SelectChangeEvent): void {
    setLanguage(event.target.value as "en" | "ru");
  }

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <IconButton onClick={onOpenSidebar} sx={{ display: { lg: "none" } }}>
          <MenuRoundedIcon />
        </IconButton>
        <Box>
          <Typography variant="h5">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
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
              minWidth: 56,
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
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: isDark ? "rgba(20,31,45,0.94)" : "#ffffff"
          }}
        >
          {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
        </IconButton>

        <Paper
          sx={{
            px: 1.5,
            py: 0.75,
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 220,
            backgroundColor: isDark ? "rgba(20,31,45,0.94)" : "#ffffff"
          }}
        >
          <SearchRoundedIcon fontSize="small" color="action" />
          <InputBase placeholder={t("common.search")} sx={{ flex: 1 }} />
        </Paper>

        <IconButton>
          <NotificationsRoundedIcon />
        </IconButton>

        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
            {(user?.email?.[0] ?? "U").toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="body2" fontWeight={800}>
              {user?.email ?? "User"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("common.member")}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}
