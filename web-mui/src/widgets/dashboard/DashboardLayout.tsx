import { useCallback, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardQuickActions } from "./DashboardQuickActions";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageAgentAction, setPageAgentAction] = useState<(() => void) | null>(null);
  const [pageAddAction, setPageAddAction] = useState<(() => void) | null>(null);
  const navigate = useNavigate();
  const openSidebar = useCallback(() => setMobileOpen(true), []);
  const registerPageAgentAction = useCallback((action: (() => void) | null) => {
    setPageAgentAction(() => action);
  }, []);
  const clearPageAgentAction = useCallback(() => {
    setPageAgentAction(null);
  }, []);
  const registerPageAddAction = useCallback((action: (() => void) | null) => {
    setPageAddAction(() => action);
  }, []);
  const clearPageAddAction = useCallback(() => {
    setPageAddAction(null);
  }, []);
  const outletContext = useMemo(
    () => ({
      openSidebar,
      collapsed,
      registerPageAgentAction,
      clearPageAgentAction,
      registerPageAddAction,
      clearPageAddAction
    }),
    [clearPageAddAction, clearPageAgentAction, collapsed, openSidebar, registerPageAddAction, registerPageAgentAction]
  );
  const handleOpenAgent = useCallback(() => {
    if (pageAgentAction) {
      pageAgentAction();
      return;
    }

    navigate("/ai-agent");
  }, [navigate, pageAgentAction]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, #0b1422 0%, #0f1827 100%)"
            : "linear-gradient(180deg, #f4f7f9 0%, #eef3f5 100%)"
      }}
    >
      <Box sx={{ display: { xs: "none", lg: "flex" }, flexShrink: 0, minHeight: "100vh" }}>
        <DashboardSidebar
          variant="desktop"
          collapsed={collapsed}
          open
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </Box>

      <DashboardSidebar
        variant="mobile"
        collapsed={false}
        open={mobileOpen}
        onToggleCollapse={() => undefined}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          <Outlet context={outletContext} />
        </Stack>
      </Box>

      <DashboardQuickActions onOpenAgent={handleOpenAgent} onOpenAdd={pageAddAction ?? undefined} />
    </Box>
  );
}
