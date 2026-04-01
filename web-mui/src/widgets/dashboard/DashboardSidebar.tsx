import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  MenuItem,
  Select,
  Typography,
  useTheme,
  type SelectChangeEvent
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { useThemeMode } from "../../app/providers/ThemeModeProvider";
import { clearAccessToken } from "../../shared/api/http";
import type { TranslationKey } from "../../shared/i18n/messages";
import { BrandMark } from "../../features/auth/components/BrandMark";
import { settingsSections } from "../settings/settingsSections";
import { dashboardNavigation } from "./navigation";

type DashboardSidebarProps = {
  variant: "desktop" | "mobile";
  collapsed: boolean;
  open: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

export function DashboardSidebar({
  variant,
  collapsed,
  open,
  onToggleCollapse,
  onCloseMobile
}: DashboardSidebarProps) {
  void open;
  const { t, language, setLanguage } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = variant === "desktop";
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith("/settings"));
  const currentSettingsSection = useMemo(() => new URLSearchParams(location.search).get("section"), [location.search]);
  const isDark = mode === "dark";

  useEffect(() => {
    if (location.pathname.startsWith("/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  function handleLanguageChange(event: SelectChangeEvent): void {
    setLanguage(event.target.value as "en" | "ru");
  }

  function handleLogout(): void {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  const sidebarContent = (
    <Stack
      sx={{
        height: "100%",
        p: 1.5,
        borderRight: isDesktop ? "1px solid" : "none",
        borderColor: "divider",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(10, 19, 32, 0.96)" : "rgba(248, 250, 252, 0.98)",
        color: theme.palette.mode === "dark" ? "#f8fafc" : theme.palette.text.primary
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.5, minHeight: 64 }}>
        <BrandMark />
        <IconButton onClick={isDesktop ? onToggleCollapse : onCloseMobile} size="small" sx={{ color: "#cbd5e1" }}>
          {isDesktop ? (collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />) : <ChevronLeftRoundedIcon />}
        </IconButton>
      </Stack>

      {!collapsed ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            mx: 0.5,
            mb: 1.25,
            px: 1,
            py: 0.5
          }}
        >
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              px: 0,
              py: 0
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
                minWidth: 44,
                fontSize: 13,
                fontWeight: 700,
                color: isDark ? "#f8fafc" : "text.primary",
                ml: -0.5,
                "& .MuiSelect-icon": {
                  color: isDark ? "rgba(248,250,252,0.82)" : "text.secondary"
                }
              }}
            >
              <MenuItem value="en">EN</MenuItem>
              <MenuItem value="ru">RU</MenuItem>
            </Select>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <IconButton
            size="small"
            onClick={toggleMode}
            title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
            sx={{
              color: isDark ? "#f8fafc" : "text.primary"
            }}
          >
            {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
          </IconButton>

          <IconButton
            size="small"
            sx={{
              color: isDark ? "#f8fafc" : "text.primary"
            }}
          >
            <NotificationsRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      ) : null}

      <Typography
        variant="caption"
        sx={{
          px: collapsed ? 0 : 1.5,
          py: 1.5,
          color: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.7)" : "rgba(71, 85, 105, 0.8)",
          textAlign: collapsed ? "center" : "left"
        }}
      >
        {collapsed ? "SF" : t("nav.overview")}
      </Typography>

      <List sx={{ flex: 1, px: 0.5 }}>
        {dashboardNavigation.map((item) => {
          const Icon = item.icon;
          const selected = location.pathname === item.path;

          if (item.id === "settings") {
            const settingsSelected = location.pathname.startsWith("/settings");
            const button = (
              <ListItemButton
                onClick={() => {
                  setSettingsOpen((current) => {
                    const next = !current;
                    if (next && !settingsSelected) {
                      navigate("/settings?section=profile");
                    }
                    return next;
                  });
                }}
                sx={{
                  minHeight: 46,
                  mb: 0.5,
                  borderRadius: 1.25,
                  color: settingsSelected
                    ? theme.palette.mode === "dark" ? "#d1fae5" : "#065f46"
                    : theme.palette.mode === "dark" ? "rgba(226, 232, 240, 0.84)" : "rgba(15, 23, 42, 0.84)",
                  background: settingsSelected ? "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))" : "transparent",
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.12)"
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed ? (
                  <>
                    <ListItemText primary={t(item.labelKey as TranslationKey)} />
                    {settingsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                  </>
                ) : null}
              </ListItemButton>
            );

            return (
              <Box key={item.id}>
                {collapsed ? (
                  <Box>{button}</Box>
                ) : (
                  button
                )}

                {settingsOpen && !collapsed ? (
                  <Stack spacing={0.5} sx={{ mt: 0.25, mb: 0.75, ml: 1.25, pl: 1.5, borderLeft: "1px solid rgba(148, 163, 184, 0.2)" }}>
                    {settingsSections.map((section) => {
                      const sectionSelected = settingsSelected && (currentSettingsSection ?? "profile") === section.id;
                      return (
                        <ListItemButton
                          key={section.id}
                          component={NavLink}
                          to={`/settings?section=${section.id}`}
                          onClick={onCloseMobile}
                          sx={{
                            minHeight: 38,
                            py: 0.6,
                            px: 1.25,
                            borderRadius: 1.25,
                            color: sectionSelected
                              ? theme.palette.mode === "dark" ? "#d1fae5" : "#065f46"
                              : theme.palette.mode === "dark" ? "rgba(203, 213, 225, 0.82)" : "rgba(30, 41, 59, 0.82)",
                            backgroundColor: sectionSelected ? "rgba(16,185,129,0.12)" : "transparent",
                            "&:hover": {
                              backgroundColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.12)"
                            }
                          }}
                        >
                          <ListItemText
                            primary={t(section.labelKey as TranslationKey)}
                            primaryTypographyProps={{ fontSize: 14, fontWeight: sectionSelected ? 700 : 600 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </Stack>
                ) : null}
              </Box>
            );
          }

          const button = (
            <ListItemButton
              component={NavLink}
              to={item.path}
              onClick={onCloseMobile}
              sx={{
                minHeight: 46,
                mb: 0.5,
                borderRadius: 1.25,
                color: selected
                  ? theme.palette.mode === "dark" ? "#d1fae5" : "#065f46"
                  : theme.palette.mode === "dark" ? "rgba(226, 232, 240, 0.84)" : "rgba(15, 23, 42, 0.84)",
                background: selected ? "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))" : "transparent",
                "&:hover": {
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.12)"
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              {!collapsed ? <ListItemText primary={t(item.labelKey as TranslationKey)} /> : null}
            </ListItemButton>
          );

          return <Box key={item.id}>{button}</Box>;
        })}
      </List>

      <List sx={{ px: 0.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 46,
            borderRadius: 1.25,
            color: theme.palette.mode === "dark" ? "rgba(248, 250, 252, 0.84)" : "rgba(15, 23, 42, 0.84)",
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.12)"
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          {!collapsed ? <ListItemText primary={t("nav.logout")} /> : null}
        </ListItemButton>
      </List>
    </Stack>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          width: collapsed ? 92 : 392,
          minHeight: "100vh",
          height: "100%",
          transition: "width 180ms ease",
          display: "flex"
        }}
      >
        {sidebarContent}
      </Box>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onCloseMobile}
      PaperProps={{
        sx: {
          width: "100vw",
          maxWidth: "100vw",
          height: "100dvh"
        }
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}
