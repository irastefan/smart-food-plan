import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";
import { Divider, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { useLanguage } from "../../../app/providers/LanguageProvider";

const providers = [
  { id: "google", icon: <GoogleIcon fontSize="small" /> },
  { id: "github", icon: <GitHubIcon fontSize="small" /> },
  { id: "x", icon: <XIcon fontSize="small" /> }
] as const;

export function SocialRow() {
  const { t } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Divider sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
          {t("common.or")}
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Stack>

      <Stack direction="row" spacing={1.5} justifyContent="center">
        {providers.map((provider) => (
          <IconButton
            key={provider.id}
            size="small"
            sx={{
              width: 40,
              height: 40,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: isDark ? "rgba(22, 34, 49, 0.9)" : "rgba(255,255,255,0.78)",
              color: "text.primary"
            }}
          >
            {provider.icon}
          </IconButton>
        ))}
      </Stack>
    </Stack>
  );
}
