import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { useThemeMode } from "../../app/providers/ThemeModeProvider";
import { getAppPreferences } from "../../shared/config/appPreferences";
import { settingsSections } from "../settings/settingsSections";
import { AiAgentAvatarIcon } from "./AiAgentAvatarIcon";
import { dashboardNavigation, type DashboardNavigationId } from "./navigation";

type DashboardQuickActionsProps = {
  onOpenAgent?: () => void;
  onOpenAdd?: () => void;
  isAgentLoading?: boolean;
};

export function DashboardQuickActions({ onOpenAgent, onOpenAdd, isAgentLoading = false }: DashboardQuickActionsProps) {
  const { language, setLanguage, t } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const location = useLocation();
  const navigate = useNavigate();
  const preferences = getAppPreferences();
  const [moreAnchorEl, setMoreAnchorEl] = useState<HTMLElement | null>(null);

  const currentNavId = useMemo<DashboardNavigationId | null>(() => {
    const match = dashboardNavigation.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
    return match?.id ?? null;
  }, [location.pathname]);

  const mobileItems = useMemo(
    () =>
      preferences.mobileQuickNavItems
        .map((id) => dashboardNavigation.find((item) => item.id === id))
        .filter((item): item is (typeof dashboardNavigation)[number] => Boolean(item))
        .filter((item) => item.id !== "settings" && item.id !== "ai-agent")
        .slice(0, 3),
    [preferences.mobileQuickNavItems]
  );

  const hiddenItems = useMemo(
    () =>
      dashboardNavigation.filter(
        (item) => item.id !== "ai-agent" && item.id !== "settings" && !mobileItems.some((mobileItem) => mobileItem.id === item.id)
      ),
    [mobileItems]
  );

  const handleOpenAgent = () => {
    if (onOpenAgent) {
      onOpenAgent();
      return;
    }

    navigate("/ai-agent");
  };

  const handleOpenMore = (event: MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleCloseMore = () => {
    setMoreAnchorEl(null);
  };

  if (isMobile) {
    const leftItems = mobileItems.slice(0, 2);
    const rightItems = mobileItems.slice(2, 3);

    return (
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1250,
          pointerEvents: "none"
        }}
      >
        <Paper
          elevation={12}
          sx={{
            borderRadius: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            background: (paletteTheme) =>
              paletteTheme.palette.mode === "dark" ? "rgba(15,22,34,0.98)" : "rgba(255,255,255,0.98)",
            pointerEvents: "auto",
            px: 1,
            pt: 0.75,
            pb: "calc(8px + env(safe-area-inset-bottom, 0px))"
          }}
        >
          <Box
            sx={{
              maxWidth: 560,
              mx: "auto",
              display: "grid",
              gridTemplateColumns: onOpenAdd ? "1fr 1fr auto auto 1fr 1fr" : "1fr 1fr auto 1fr 1fr",
              alignItems: "center",
              gap: 0.5
            }}
          >
            {leftItems.map((item) => (
              <MobileNavItem
                key={item.id}
                icon={<item.icon fontSize="small" />}
                label={t(item.labelKey as never)}
                selected={currentNavId === item.id}
                onClick={() => navigate(item.path)}
              />
            ))}
            {Array.from({ length: 2 - leftItems.length }).map((_, index) => (
              <Box key={`left-spacer-${index}`} />
            ))}

            <Tooltip title={t("layout.contextAgent")}>
              <DockActionButton
                icon={<AiAgentAvatarIcon size={26} variant={isAgentLoading ? "loading" : "active"} />}
                active
                onClick={handleOpenAgent}
              />
            </Tooltip>

            {onOpenAdd ? (
              <Tooltip title={t("common.add")}>
                <DockActionButton icon={<AddRoundedIcon sx={{ fontSize: 24 }} />} onClick={onOpenAdd} />
              </Tooltip>
            ) : null}

            {rightItems.map((item) => (
              <MobileNavItem
                key={item.id}
                icon={<item.icon fontSize="small" />}
                label={t(item.labelKey as never)}
                selected={currentNavId === item.id}
                onClick={() => navigate(item.path)}
              />
            ))}
            {Array.from({ length: 1 - rightItems.length }).map((_, index) => (
              <Box key={`right-spacer-${index}`} />
            ))}

            <MobileNavItem
              icon={<MoreHorizRoundedIcon fontSize="small" />}
              label={t("nav.more")}
              selected={Boolean(moreAnchorEl) || location.pathname.startsWith("/settings")}
              onClick={handleOpenMore}
            />
          </Box>
        </Paper>

        <Menu
          anchorEl={moreAnchorEl}
          open={Boolean(moreAnchorEl)}
          onClose={handleCloseMore}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          PaperProps={{
            sx: {
              minWidth: 248,
              borderRadius: 1.5
            }
          }}
        >
          <MenuItem disabled sx={{ opacity: 1, fontWeight: 700 }}>
            <LanguageRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
            {t("common.language")}
          </MenuItem>
          <MenuItem
            selected={language === "en"}
            onClick={() => {
              setLanguage("en");
              handleCloseMore();
            }}
          >
            EN
          </MenuItem>
          <MenuItem
            selected={language === "ru"}
            onClick={() => {
              setLanguage("ru");
              handleCloseMore();
            }}
          >
            RU
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              toggleMode();
              handleCloseMore();
            }}
          >
            {mode === "dark" ? <LightModeRoundedIcon fontSize="small" sx={{ mr: 1.25 }} /> : <DarkModeRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />}
            {mode === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
          </MenuItem>

          {hiddenItems.length > 0 ? <Divider /> : null}

          {hiddenItems.map((item) => {
            const Icon = item.icon;
            return (
              <MenuItem
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  handleCloseMore();
                }}
              >
                <Icon fontSize="small" sx={{ mr: 1.25 }} />
                {t(item.labelKey as never)}
              </MenuItem>
            );
          })}

          <Divider />

          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <MenuItem
                key={section.id}
                onClick={() => {
                  navigate(`/settings?section=${section.id}`);
                  handleCloseMore();
                }}
              >
                <Icon fontSize="small" sx={{ mr: 1.25 }} />
                {t(section.labelKey as never)}
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
    );
  }

  return null;
}

function MobileNavItem({
  icon,
  label,
  selected,
  onClick
}: {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Stack
      onClick={onClick}
      spacing={0.25}
      alignItems="center"
      sx={{
        minWidth: 0,
        cursor: "pointer",
        py: 0.35,
        color: selected ? "#10b981" : "text.secondary"
      }}
    >
      <Box sx={{ lineHeight: 1, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 10,
          lineHeight: 1.1,
          fontWeight: selected ? 700 : 500,
          textAlign: "center",
          whiteSpace: "nowrap"
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function DockActionButton({ icon, onClick, active = false }: { icon: ReactNode; onClick: () => void; active?: boolean }) {
  const activeColor = "#10b981";

  return (
    <IconButton
      onClick={onClick}
      sx={{
        width: 46,
        height: 46,
        color: active ? "#ecfdf5" : "text.primary",
        backgroundColor: active ? activeColor : "rgba(255,255,255,0.06)",
        border: "1px solid",
        borderColor: active ? "rgba(16,185,129,0.55)" : "divider",
        boxShadow: "none",
        "&:hover": {
          backgroundColor: active ? "#0ea371" : "rgba(255,255,255,0.1)"
        }
      }}
    >
      {icon}
    </IconButton>
  );
}
