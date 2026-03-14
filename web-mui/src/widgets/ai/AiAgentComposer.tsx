import MicRoundedIcon from "@mui/icons-material/MicRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Button, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type AiAgentComposerProps = {
  isSubmitting: boolean;
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
};

export function AiAgentComposer({ isSubmitting, placeholder, submitLabel, onSubmit }: AiAgentComposerProps) {
  const { language, t } = useLanguage();
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const SpeechRecognitionApi = useMemo(
    () => (typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null : null),
    []
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  function handleSubmit() {
    const text = value.trim();
    if (!text) {
      return;
    }
    onSubmit(text);
    setValue("");
  }

  function handleVoiceToggle() {
    if (!SpeechRecognitionApi) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "ru" ? "ru-RU" : "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setValue(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setIsRecording(true);
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
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title={SpeechRecognitionApi ? (isRecording ? t("aiAgent.voice.stop") : t("aiAgent.voice.start")) : t("aiAgent.voice.unsupported")}>
                  <span>
                    <IconButton
                      onClick={handleVoiceToggle}
                      disabled={!SpeechRecognitionApi}
                      color={isRecording ? "error" : "default"}
                      sx={{ bgcolor: isRecording ? "rgba(239,68,68,0.12)" : "transparent" }}
                    >
                      {isRecording ? <StopRoundedIcon /> : <MicRoundedIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  endIcon={<SendRoundedIcon />}
                  disabled={isSubmitting || value.trim().length === 0 || isRecording}
                  sx={{ minWidth: 124 }}
                >
                  {submitLabel}
                </Button>
              </InputAdornment>
            )
          }}
          helperText={isRecording ? t("aiAgent.voice.listening") : " "}
        />
      </Stack>
    </Paper>
  );
}
