import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import {
  Avatar,
  Box,
  IconButton,
  MenuItem,
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
    <Stack spacing={{ xs: 1.25, md: 1.75 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <IconButton onClick={onOpenSidebar} sx={{ display: { lg: "none" }, flexShrink: 0 }}>
            <MenuRoundedIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: 24, md: undefined },
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {title}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={{ xs: 0.75, md: 1.25 }} alignItems="center" justifyContent="flex-end" sx={{ flexShrink: 0 }}>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{
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
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: isDark ? "rgba(20,31,45,0.94)" : "#ffffff"
          }}
        >
          {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
        </IconButton>

        <IconButton sx={{ display: { xs: "none", sm: "inline-flex" } }}>
          <NotificationsRoundedIcon />
        </IconButton>

        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
            {(user?.email?.[0] ?? "U").toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: "none", lg: "block" } }}>
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

      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ pl: { xs: 0, md: 0 } }}>
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}
