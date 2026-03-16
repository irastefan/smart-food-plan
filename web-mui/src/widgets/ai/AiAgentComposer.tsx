import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Avatar, Button, IconButton, Paper, Stack, TextField, Tooltip } from "@mui/material";
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
  onSubmit: (payload: { text: string; images: Array<{ name: string; dataUrl: string }> }) => Promise<void>;
};

type ComposerImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export function AiAgentComposer({ isSubmitting, placeholder, submitLabel, onSubmit }: AiAgentComposerProps) {
  const { language, t } = useLanguage();
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [images, setImages] = useState<ComposerImage[]>([]);
  const imagesRef = useRef<ComposerImage[]>([]);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const SpeechRecognitionApi = useMemo(
    () => (typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null : null),
    []
  );

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      recognitionRef.current = null;
    };
  }, []);

  async function toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.readAsDataURL(file);
    });
  }

  function appendFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextImages = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    setImages((current) => [...current, ...nextImages]);
  }

  function removeImage(imageId: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.id !== imageId);
    });
  }

  async function handleSubmit() {
    const text = value.trim();
    if (!text && images.length === 0) {
      return;
    }

    const payloadImages = await Promise.all(
      images.map(async (image) => ({
        name: image.file.name,
        dataUrl: await toDataUrl(image.file)
      }))
    );

    await onSubmit({ text, images: payloadImages });
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
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
        p: { xs: 1.25, md: 1.5 },
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
      <Stack spacing={1.25}>
        {images.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {images.map((image) => (
              <Stack
                key={image.id}
                spacing={0.5}
                sx={{
                  width: 88,
                  p: 0.75,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                  position: "relative"
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => removeImage(image.id)}
                  sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(15,23,42,0.55)", color: "#fff", "&:hover": { bgcolor: "rgba(15,23,42,0.72)" } }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <Avatar
                  variant="rounded"
                  src={image.previewUrl}
                  alt={image.file.name}
                  sx={{ width: 72, height: 72, borderRadius: 1, bgcolor: "action.hover" }}
                />
              </Stack>
            ))}
          </Stack>
        ) : null}

        <TextField
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          multiline
          minRows={2}
          maxRows={8}
          fullWidth
          helperText={isRecording ? t("aiAgent.voice.listening") : " "}
        />

        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                appendFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(event) => {
                appendFiles(event.target.files);
                event.target.value = "";
              }}
            />

            <Tooltip title={t("aiAgent.image.upload")}>
              <span>
                <IconButton
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isSubmitting || isRecording}
                  sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
                >
                  <AddPhotoAlternateRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t("aiAgent.image.camera")}>
              <span>
                <IconButton
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isSubmitting || isRecording}
                  sx={{ border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
                >
                  <PhotoCameraRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={
                SpeechRecognitionApi
                  ? isRecording
                    ? t("aiAgent.voice.stop")
                    : t("aiAgent.voice.start")
                  : t("aiAgent.voice.unsupported")
              }
            >
              <span>
                <IconButton
                  onClick={handleVoiceToggle}
                  disabled={!SpeechRecognitionApi || isSubmitting}
                  color={isRecording ? "error" : "default"}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: isRecording ? "rgba(239,68,68,0.12)" : "background.paper"
                  }}
                >
                  {isRecording ? <StopRoundedIcon /> : <MicRoundedIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Button
            onClick={handleSubmit}
            variant="contained"
            endIcon={<SendRoundedIcon />}
            disabled={isSubmitting || (!value.trim() && images.length === 0) || isRecording}
            sx={{ minWidth: { xs: 112, md: 124 } }}
          >
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
