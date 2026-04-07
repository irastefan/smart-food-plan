import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import { Button, Link, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";

type OpenAiApiKeyCardProps = {
  value: string;
  isSubmitting: boolean;
  onSave: (value: string) => void;
};

export function OpenAiApiKeyCard({ value, isSubmitting, onSave }: OpenAiApiKeyCardProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <KeyRoundedIcon color="primary" />
        <div>
          <Typography variant="h6" fontWeight={800}>{t("settings.openai.title")}</Typography>
          <Typography color="text.secondary">{t("settings.openai.subtitle")}</Typography>
        </div>
      </Stack>

      <TextField
        label={t("settings.openai.apiKey")}
        type="password"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="sk-..."
        fullWidth
      />

      <Stack spacing={0.75}>
        <Typography variant="body2" fontWeight={700}>
          {t("settings.openai.howToTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. {t("settings.openai.howToStep1")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          2. {t("settings.openai.howToStep2")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          3. {t("settings.openai.howToStep3")}
        </Typography>
        <Link
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noreferrer"
          underline="hover"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, width: "fit-content" }}
        >
          {t("settings.openai.openPortal")}
          <LaunchRoundedIcon sx={{ fontSize: 16 }} />
        </Link>
      </Stack>

      <Stack sx={{ alignSelf: { md: "flex-end" }, width: { xs: "100%", md: "auto" } }}>
        <Button
          onClick={() => onSave(draft)}
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={isSubmitting}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {t("settings.openai.save")}
        </Button>
      </Stack>
    </Stack>
  );
}
