import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Button, Paper, Stack, TextField } from "@mui/material";
import { useState } from "react";

type AiAgentComposerProps = {
  isSubmitting: boolean;
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
};

export function AiAgentComposer({ isSubmitting, placeholder, submitLabel, onSubmit }: AiAgentComposerProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const text = value.trim();
    if (!text) {
      return;
    }
    onSubmit(text);
    setValue("");
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          multiline
          minRows={2}
          fullWidth
        />
        <Button onClick={handleSubmit} variant="contained" endIcon={<SendRoundedIcon />} disabled={isSubmitting || value.trim().length === 0} sx={{ minWidth: 140 }}>
          {submitLabel}
        </Button>
      </Stack>
    </Paper>
  );
}
