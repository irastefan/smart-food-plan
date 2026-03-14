import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
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
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { clearAccessToken } from "../../shared/api/http";
import type { TranslationKey } from "../../shared/i18n/messages";
import { BrandMark } from "../../features/auth/components/BrandMark";
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
          const button = (
            <ListItemButton
              component={NavLink}
              to={item.path}
              onClick={onCloseMobile}
              sx={{
                minHeight: 46,
                mb: 0.5,
                borderRadius: 2,
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
            borderRadius: 2,
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
