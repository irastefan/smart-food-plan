import { useCallback, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { GlobalAiAgentDialog } from "../ai/GlobalAiAgentDialog";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardQuickActions } from "./DashboardQuickActions";

export function DashboardLayout() {
  const mobileDockOffset = "calc(68px + env(safe-area-inset-bottom, 0px))";
  const { language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalAgentOpen, setGlobalAgentOpen] = useState(false);
  const [pageAgentAction, setPageAgentAction] = useState<(() => void) | null>(null);
  const [pageAgentOpen, setPageAgentOpen] = useState(false);
  const [pageAddAction, setPageAddAction] = useState<(() => void) | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const openSidebar = useCallback(() => setMobileOpen(true), []);
  const toggleMobileSidebar = useCallback(() => setMobileOpen((current) => !current), []);
  const registerPageAgentAction = useCallback((action: (() => void) | null) => {
    setPageAgentAction(() => action);
  }, []);
  const clearPageAgentAction = useCallback(() => {
    setPageAgentAction(null);
  }, []);
  const registerPageAgentOpen = useCallback((value: boolean) => {
    setPageAgentOpen(value);
  }, []);
  const clearPageAgentOpen = useCallback(() => {
    setPageAgentOpen(false);
  }, []);
  const registerPageAddAction = useCallback((action: (() => void) | null) => {
    setPageAddAction(() => action);
  }, []);
  const clearPageAddAction = useCallback(() => {
    setPageAddAction(null);
  }, []);
  const registerPageLoading = useCallback((value: boolean) => {
    setPageLoading(value);
  }, []);
  const clearPageLoading = useCallback(() => {
    setPageLoading(false);
  }, []);
  const outletContext = useMemo(
    () => ({
      openSidebar,
      collapsed,
      registerPageAgentAction,
      clearPageAgentAction,
      registerPageAgentOpen,
      clearPageAgentOpen,
      registerPageAddAction,
      clearPageAddAction,
      registerPageLoading,
      clearPageLoading
    }),
    [
      clearPageAddAction,
      clearPageAgentAction,
      clearPageAgentOpen,
      clearPageLoading,
      collapsed,
      openSidebar,
      registerPageAddAction,
      registerPageAgentAction,
      registerPageAgentOpen,
      registerPageLoading
    ]
  );
  const handleOpenAgent = useCallback(() => {
    if (globalAgentOpen) {
      setGlobalAgentOpen(false);
      return;
    }

    if (pageAgentAction) {
      pageAgentAction();
      return;
    }

    setGlobalAgentOpen(true);
  }, [globalAgentOpen, pageAgentAction]);

  return (
    <Box
      key={isRtl ? "rtl" : "ltr"}
      dir={isRtl ? "rtl" : "ltr"}
      style={{ direction: isRtl ? "rtl" : "ltr" }}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        direction: isRtl ? "rtl" : "ltr",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #0b1422 0%, #0f1827 100%)"
            : "linear-gradient(180deg, #f4f7f9 0%, #eef3f5 100%)"
      }}
    >
      <Box
        dir={isRtl ? "rtl" : "ltr"}
        style={{ direction: isRtl ? "rtl" : "ltr" }}
        sx={{ display: { xs: "none", lg: "flex" }, flexShrink: 0, minHeight: "100vh" }}
      >
        <DashboardSidebar
          variant="desktop"
          collapsed={collapsed}
          open
          globalAgentOpen={globalAgentOpen}
          onOpenGlobalAgent={handleOpenAgent}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </Box>

      <DashboardSidebar
        variant="mobile"
        collapsed={false}
        open={mobileOpen}
        globalAgentOpen={globalAgentOpen}
        onOpenGlobalAgent={handleOpenAgent}
        onToggleCollapse={() => undefined}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <Box dir={isRtl ? "rtl" : "ltr"} style={{ direction: isRtl ? "rtl" : "ltr" }} sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          sx={{
            minHeight: "100vh",
            px: { xs: 2, md: 3 },
            pt: { xs: 2, md: 3 },
            pb: { xs: mobileDockOffset, md: 3 }
          }}
        >
          <Outlet context={outletContext} />
        </Stack>
      </Box>

      <DashboardQuickActions
        onOpenAgent={handleOpenAgent}
        onOpenAdd={pageAddAction ?? undefined}
        isAgentOpen={globalAgentOpen || pageAgentOpen}
        isMoreOpen={mobileOpen}
        onToggleMore={toggleMobileSidebar}
        isAgentLoading={pageLoading}
      />
      <GlobalAiAgentDialog open={globalAgentOpen} onClose={() => setGlobalAgentOpen(false)} />
    </Box>
  );
}
