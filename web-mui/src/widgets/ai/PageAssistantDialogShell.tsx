import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";

type PageAssistantDialogShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function PageAssistantDialogShell({ open, title, onClose, children }: PageAssistantDialogShellProps) {
  const mobileDockOffset = "calc(68px + env(safe-area-inset-bottom, 0px))";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { language } = useLanguage();
  const isRtl = isRtlLanguage(language);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dir={isRtl ? "rtl" : "ltr"}
      fullScreen={isMobile}
      fullWidth
      maxWidth={false}
      sx={
        isMobile
          ? {
              "& .MuiDialog-container": {
                alignItems: "flex-start"
              }
            }
          : undefined
      }
      PaperProps={{
        dir: isRtl ? "rtl" : "ltr",
        sx: isMobile
          ? {
              direction: isRtl ? "rtl" : "ltr",
              width: "100%",
              maxWidth: "100%",
              height: `calc(100dvh - ${mobileDockOffset})`,
              maxHeight: `calc(100dvh - ${mobileDockOffset})`,
              margin: 0,
              borderRadius: 0,
              overflow: "hidden"
            }
          : {
              width: "76vw",
              maxWidth: 1180,
              height: "84vh",
              maxHeight: "84vh",
              borderRadius: 1.5,
              overflow: "hidden",
              direction: isRtl ? "rtl" : "ltr"
            }
      }}
    >
      <DialogTitle dir={isRtl ? "rtl" : "ltr"} sx={{ paddingInlineEnd: 2, textAlign: "start" }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-start"
          sx={{ width: "100%", textAlign: "start" }}
        >
          <IconButton onClick={onClose} edge="start" size="small">
            {isRtl ? <ArrowForwardRoundedIcon /> : <ArrowBackRoundedIcon />}
          </IconButton>
          <Typography component="span" variant="h6" fontWeight={800}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 0, md: 2 }, pb: 0, direction: isRtl ? "rtl" : "ltr" }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
