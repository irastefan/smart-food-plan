import { Paper, Stack, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";

type SettingsSectionCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function SettingsSectionCard({ title, subtitle, children }: SettingsSectionCardProps) {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={800}>{title}</Typography>
          <Typography color="text.secondary">{subtitle}</Typography>
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}
