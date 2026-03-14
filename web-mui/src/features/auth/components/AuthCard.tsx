import type { PropsWithChildren, ReactNode } from "react";
import { Box, Paper, useTheme } from "@mui/material";

type AuthCardProps = PropsWithChildren<{
  header: ReactNode;
  footer?: ReactNode;
}>;

export function AuthCard({ header, footer, children }: AuthCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 470,
        borderRadius: { xs: 4, sm: 5 },
        p: { xs: 3, sm: 4 },
        border: "1px solid",
        borderColor: isDark ? "rgba(148, 163, 184, 0.10)" : "rgba(26, 36, 48, 0.08)",
        boxShadow: isDark ? "0 24px 72px rgba(0, 0, 0, 0.34)" : "0 24px 80px rgba(28, 36, 48, 0.10)",
        backdropFilter: "blur(18px)",
        background: isDark
          ? "linear-gradient(180deg, rgba(20, 30, 45, 0.94) 0%, rgba(14, 23, 36, 0.98) 100%)"
          : "rgba(255,255,255,0.82)"
      }}
    >
      <Box sx={{ mb: 4 }}>{header}</Box>
      <Box>{children}</Box>
      {footer ? <Box sx={{ mt: 3 }}>{footer}</Box> : null}
    </Paper>
  );
}
