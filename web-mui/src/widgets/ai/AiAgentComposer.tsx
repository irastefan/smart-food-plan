import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Button, InputAdornment, Paper, Stack, TextField } from "@mui/material";
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
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        position: "sticky",
        bottom: 16,
        zIndex: 2,
        backdropFilter: "blur(18px)",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(20,31,45,0.86)" : "rgba(255,255,255,0.88)"
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems="flex-end">
        <TextField
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          multiline
          minRows={2}
          maxRows={8}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  endIcon={<SendRoundedIcon />}
                  disabled={isSubmitting || value.trim().length === 0}
                  sx={{ minWidth: 124 }}
                >
                  {submitLabel}
                </Button>
              </InputAdornment>
            )
          }}
        />
      </Stack>
    </Paper>
  );
}
