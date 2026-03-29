import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";

type PageAssistantDialogShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function PageAssistantDialogShell({ open, title, onClose, children }: PageAssistantDialogShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: isMobile
          ? undefined
          : {
              width: "76vw",
              maxWidth: 1180,
              height: "84vh",
              maxHeight: "84vh",
              borderRadius: 1.5,
              overflow: "hidden"
            }
      }}
    >
      <DialogTitle sx={{ pr: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={onClose} edge="start" size="small">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography component="span" variant="h6" fontWeight={800}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 0, md: 2 }, pb: 0 }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
