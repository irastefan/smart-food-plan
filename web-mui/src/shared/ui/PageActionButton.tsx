import { Button, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

type PageActionButtonProps = {
  label?: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "agent" | "neutral";
  sx?: SxProps<Theme>;
};

export function PageActionButton({ label, icon, onClick, variant = "neutral", sx }: PageActionButtonProps) {
  const isAgent = variant === "agent";
  const agentColor = "#10b981";

  return (
    <Button
      onClick={onClick}
      startIcon={icon}
      variant="outlined"
      sx={{
        minWidth: 0,
        px: label ? 1.4 : 1.1,
        py: 0.72,
        minHeight: 42,
        borderRadius: 1,
        borderColor: isAgent ? "rgba(16,185,129,0.38)" : "divider",
        color: isAgent ? agentColor : "text.primary",
        backgroundColor: (theme) =>
          isAgent
            ? theme.palette.mode === "dark"
              ? "rgba(16,185,129,0.1)"
              : "rgba(16,185,129,0.08)"
            : theme.palette.mode === "dark"
              ? "rgba(20,31,45,0.94)"
              : "#ffffff",
        boxShadow: "none",
        whiteSpace: "nowrap",
        "&:hover": {
          borderColor: isAgent ? "rgba(16,185,129,0.46)" : "divider",
          backgroundColor: (theme) =>
            isAgent
              ? theme.palette.mode === "dark"
                ? "rgba(16,185,129,0.14)"
                : "rgba(16,185,129,0.1)"
              : theme.palette.mode === "dark"
                ? "rgba(28,40,57,0.98)"
                : "#ffffff"
        },
        ...sx
      }}
    >
      {label}
    </Button>
  );
}
