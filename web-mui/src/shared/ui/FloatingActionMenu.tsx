import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { IconButton, Menu, MenuItem, Paper, Tooltip } from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";

export type FloatingActionMenuItem = {
  key: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
};

type FloatingActionMenuProps = {
  tooltip: string;
  items?: FloatingActionMenuItem[];
  onClick?: () => void;
};

export function FloatingActionMenu({ tooltip, items, onClick }: FloatingActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const usesMenu = Boolean(items?.length);

  function handleFabClick(event: React.MouseEvent<HTMLElement>) {
    if (usesMenu) {
      setAnchorEl(event.currentTarget);
      return;
    }

    onClick?.();
  }

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          zIndex: 1200,
          borderRadius: "999px",
          border: "1px solid",
          borderColor: "rgba(16,185,129,0.38)",
          background: "linear-gradient(180deg, rgba(20,34,31,0.98), rgba(13,26,23,0.98))",
          boxShadow: "0 14px 34px rgba(5, 18, 14, 0.32)",
          overflow: "hidden"
        }}
      >
        <Tooltip title={tooltip}>
          <IconButton
            onClick={handleFabClick}
            sx={{
              width: 58,
              height: 58,
              color: "#ecfdf5",
              background: "linear-gradient(135deg, #10b981, #22c55e)",
              "&:hover": {
                background: "linear-gradient(135deg, #0ea371, #16a34a)"
              }
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 30 }} />
          </IconButton>
        </Tooltip>
      </Paper>

      {usesMenu ? (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {items?.map((item) => (
            <MenuItem
              key={item.key}
              onClick={() => {
                setAnchorEl(null);
                item.onClick();
              }}
              sx={{ gap: 1 }}
            >
              {item.icon}
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </>
  );
}
