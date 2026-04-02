import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, Chip, Stack } from "@mui/material";
import type { ReactNode } from "react";

export type FilterChipRowItem = {
  value: string;
  label: string;
  onDelete?: () => void;
  icon?: ReactNode;
};

type FilterChipRowProps = {
  value: string;
  items: FilterChipRowItem[];
  onChange: (value: string) => void;
  addLabel?: string;
  onAdd?: () => void;
  wrapOnDesktop?: boolean;
};

export function FilterChipRow({ value, items, onChange, addLabel, onAdd, wrapOnDesktop = false }: FilterChipRowProps) {
  return (
    <Box
      sx={{
        overflowX: { xs: "auto", md: wrapOnDesktop ? "visible" : "auto" },
        overflowY: "hidden",
        pb: 0.5,
        WebkitOverflowScrolling: "touch",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none"
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: { xs: "nowrap", md: wrapOnDesktop ? "wrap" : "nowrap" },
          width: { xs: "max-content", md: wrapOnDesktop ? "auto" : "max-content" },
          minWidth: 0,
          paddingInlineEnd: 0.5
        }}
      >
        {items.map((item) => (
          <Chip
            key={item.value}
            clickable
            label={
              <Stack direction="row" spacing={0.7} alignItems="center">
                {item.icon}
                <span>{item.label}</span>
              </Stack>
            }
            color={value === item.value ? "primary" : "default"}
            onClick={() => onChange(item.value)}
            onDelete={item.onDelete}
            sx={{
              height: 36,
              borderRadius: 1.25,
              fontWeight: 700,
              whiteSpace: "nowrap",
              px: item.onDelete ? 0.25 : 0,
              "& .MuiChip-label": {
                px: 1.5
              },
              "& .MuiChip-deleteIcon": {
                marginInlineEnd: 0.75,
                marginInlineStart: -0.25,
                fontSize: 18
              }
            }}
          />
        ))}
        {onAdd ? (
          <Chip
            clickable
            variant="outlined"
            label={
              <Stack direction="row" spacing={0.6} alignItems="center">
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                <span>{addLabel}</span>
              </Stack>
            }
            onClick={onAdd}
            sx={{
              height: 36,
              borderRadius: 1.25,
              fontWeight: 700,
              whiteSpace: "nowrap",
              "& .MuiChip-label": {
                px: 1.5
              }
            }}
          />
        ) : null}
      </Box>
    </Box>
  );
}
