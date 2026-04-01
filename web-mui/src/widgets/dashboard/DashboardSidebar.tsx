import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
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
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
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
  const { t } = useLanguage();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = variant === "desktop";
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith("/settings"));
  const currentSettingsSection = useMemo(() => new URLSearchParams(location.search).get("section"), [location.search]);

  useEffect(() => {
    if (location.pathname.startsWith("/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  function handleLogout(): void {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  const sidebarContent = (
    <Stack
      sx={{
        height: "100%",
        p: 1.5,
        borderRight: "1px solid",
        borderColor: "divider",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(10, 19, 32, 0.96)" : "#081521",
        color: "#f8fafc"
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.5, minHeight: 64 }}>
        <BrandMark />
        <IconButton onClick={isDesktop ? onToggleCollapse : onCloseMobile} size="small" sx={{ color: "#cbd5e1" }}>
          {isDesktop ? collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon /> : <MenuRoundedIcon />}
        </IconButton>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          px: collapsed ? 0 : 1.5,
          py: 1.5,
          color: "rgba(148, 163, 184, 0.7)",
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
                  if (!isDesktop || collapsed) {
                    navigate("/settings?section=profile");
                    onCloseMobile();
                    return;
                  }

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
                  color: settingsSelected ? "#d1fae5" : "rgba(226, 232, 240, 0.84)",
                  background: settingsSelected ? "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))" : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(148, 163, 184, 0.08)"
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed ? (
                  <>
                    <ListItemText primary={t(item.labelKey as TranslationKey)} />
                    {isDesktop ? settingsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" /> : null}
                  </>
                ) : null}
              </ListItemButton>
            );

            return (
              <Box key={item.id}>
                {collapsed ? (
                  <Tooltip title={t(item.labelKey as TranslationKey)} placement="right">
                    <Box>{button}</Box>
                  </Tooltip>
                ) : (
                  button
                )}

                {isDesktop && !collapsed && settingsOpen ? (
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
                            color: sectionSelected ? "#d1fae5" : "rgba(203, 213, 225, 0.82)",
                            backgroundColor: sectionSelected ? "rgba(16,185,129,0.12)" : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(148, 163, 184, 0.08)"
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
                color: selected ? "#d1fae5" : "rgba(226, 232, 240, 0.84)",
                background: selected ? "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))" : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(148, 163, 184, 0.08)"
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              {!collapsed ? <ListItemText primary={t(item.labelKey as TranslationKey)} /> : null}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip title={t(item.labelKey as TranslationKey)} placement="right" key={item.id}>
              <Box>{button}</Box>
            </Tooltip>
          ) : (
            <Box key={item.id}>{button}</Box>
          );
        })}
      </List>

      <List sx={{ px: 0.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 46,
            borderRadius: 1.25,
            color: "rgba(248, 250, 252, 0.84)",
            "&:hover": {
              backgroundColor: "rgba(148, 163, 184, 0.08)"
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
          width: collapsed ? 92 : 280,
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
    <Drawer open={open} onClose={onCloseMobile} PaperProps={{ sx: { width: 280 } }}>
      {sidebarContent}
    </Drawer>
  );
}
