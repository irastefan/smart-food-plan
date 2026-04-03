import { Alert, Snackbar, type AlertColor } from "@mui/material";

type AppFeedbackToastProps = {
  feedback: { type: AlertColor; message: string } | null;
  onClose: () => void;
  autoHideDuration?: number;
};

export function AppFeedbackToast({ feedback, onClose, autoHideDuration = 2600 }: AppFeedbackToastProps) {
  return (
    <Snackbar
      open={Boolean(feedback)}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{
        bottom: {
          xs: "calc(var(--dashboard-mobile-dock-height, 0px) + env(safe-area-inset-bottom, 0px) + 12px)",
          md: 24
        }
      }}
    >
      <Alert
        severity={feedback?.type ?? "success"}
        onClose={onClose}
        variant="standard"
        sx={{
          width: "100%",
          minWidth: { xs: "min(calc(100vw - 24px), 320px)", sm: 360 },
          alignItems: "center",
          borderRadius: 1.5,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
          bgcolor: "background.paper",
          color: "text.primary",
          backdropFilter: "blur(12px)",
          "& .MuiAlert-message": {
            fontWeight: 600
          }
        }}
      >
        {feedback?.message}
      </Alert>
    </Snackbar>
  );
}
