import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CameraswitchRoundedIcon from "@mui/icons-material/CameraswitchRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputBase, Menu, MenuItem, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { Language } from "../../shared/i18n/messages";
import { getLanguageSpeechLocale, isRtlLanguage } from "../../shared/i18n/languages";

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
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
  value: string;
  speechLanguage: "interface" | Language;
  onValueChange: (value: string) => void;
  onSubmit: (payload: { text: string; images: Array<{ name: string; dataUrl: string }> }) => Promise<void>;
};

type ComposerImage = {
  id: string;
  file: File;
  previewUrl: string;
};

export function AiAgentComposer({
  isSubmitting,
  placeholder,
  submitLabel: _submitLabel,
  value,
  speechLanguage,
  onValueChange,
  onSubmit
}: AiAgentComposerProps) {
  const { language, t } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const [isRecording, setIsRecording] = useState(false);
  const [images, setImages] = useState<ComposerImage[]>([]);
  const imagesRef = useRef<ComposerImage[]>([]);
  const speechFinalTextRef = useRef("");
  const processedResultIndexRef = useRef(0);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [attachAnchor, setAttachAnchor] = useState<HTMLElement | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const SpeechRecognitionApi = useMemo(
    () => (typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null : null),
    []
  );
  const isMobileSpeechMode = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cameraDialogOpen || !videoRef.current || !cameraStreamRef.current) {
      return;
    }

    videoRef.current.srcObject = cameraStreamRef.current;
    void videoRef.current.play().catch(() => {
      // ignore autoplay failures; user can still interact manually
    });
  }, [cameraDialogOpen]);

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

  function appendCapturedFile(file: File) {
    const nextImage = {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file)
    };

    setImages((current) => [...current, nextImage]);
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

  function stopCameraStream() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function openCameraDialog() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });
      stopCameraStream();
      cameraStreamRef.current = stream;
      setCameraDialogOpen(true);
    } catch (primaryError) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        stopCameraStream();
        cameraStreamRef.current = fallbackStream;
        setCameraDialogOpen(true);
      } catch {
        console.error("Failed to open camera", primaryError);
        setCameraError(t("aiAgent.image.cameraError"));
        cameraInputRef.current?.click();
      }
    }
  }

  function handleCloseCameraDialog() {
    setCameraDialogOpen(false);
    setCameraError(null);
    stopCameraStream();
  }

  async function handleCapturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92);
    });

    if (!blob) {
      return;
    }

    appendCapturedFile(new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" }));
    handleCloseCameraDialog();
  }

  async function handleSubmit() {
    const text = value.trim();
    if (!text && images.length === 0) {
      return;
    }

    const currentImages = [...images];
    const payloadImages = await Promise.all(
      currentImages.map(async (image) => ({
        name: image.file.name,
        dataUrl: await toDataUrl(image.file)
      }))
    );

    onValueChange("");
    setImages([]);

    await onSubmit({ text, images: payloadImages });
    currentImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
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

    speechFinalTextRef.current = value.trim();
    processedResultIndexRef.current = 0;
    const recognition = new SpeechRecognitionApi();
    recognitionRef.current = recognition;
    recognition.continuous = !isMobileSpeechMode;
    recognition.interimResults = !isMobileSpeechMode;
    const resolvedSpeechLanguage = speechLanguage === "interface" ? language : speechLanguage;
    recognition.lang = getLanguageSpeechLocale(resolvedSpeechLanguage);

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      const startIndex = isMobileSpeechMode ? processedResultIndexRef.current : event.resultIndex;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim() ?? "";
        if (!transcript) {
          continue;
        }

        // Mobile browsers may replay older interim fragments in subsequent events.
        // Only append newly finalized chunks, and keep the latest interim chunk separate.
        if ("isFinal" in result && (result as { isFinal?: boolean }).isFinal) {
          finalChunk += `${transcript} `;
          processedResultIndexRef.current = index + 1;
        } else {
          interimChunk += `${transcript} `;
        }
      }

      if (finalChunk.trim().length > 0) {
        const nextFinal = `${speechFinalTextRef.current} ${finalChunk}`.trim();
        speechFinalTextRef.current = nextFinal;
      }

      const nextValue = `${speechFinalTextRef.current} ${isMobileSpeechMode ? "" : interimChunk}`.trim();
      onValueChange(nextValue);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      onValueChange(speechFinalTextRef.current.trim());
    };

    recognition.start();
    setIsRecording(true);
  }

  return (
    <Paper
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        direction: isRtl ? "rtl" : "ltr",
        px: { xs: 0.6, md: 0.75 },
        py: { xs: 0.28, md: 0.34 },
        borderRadius: 1,
        border: "1px solid",
        borderColor: "rgba(16,185,129,0.72)",
        position: "sticky",
        bottom: { xs: 8, md: 12 },
        zIndex: 6,
        backdropFilter: "blur(14px)",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(26, 31, 42, 0.96)" : "rgba(255,255,255,0.97)",
        boxShadow: "none"
      }}
    >
      <Stack spacing={0.6}>
        {images.length > 0 ? (
          <Stack direction={isRtl ? "row-reverse" : "row"} spacing={1} useFlexGap flexWrap="wrap">
            {images.map((image) => (
              <Stack
                key={image.id}
                spacing={0.5}
                sx={{
                  width: 72,
                  p: 0.5,
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
                  sx={{
                    position: "absolute",
                    top: 2,
                    insetInlineEnd: 2,
                    bgcolor: "rgba(15,23,42,0.55)",
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(15,23,42,0.72)" }
                  }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <Avatar
                  variant="rounded"
                  src={image.previewUrl}
                  alt={image.file.name}
                  sx={{ width: 60, height: 60, borderRadius: 1, bgcolor: "action.hover" }}
                />
              </Stack>
            ))}
          </Stack>
        ) : null}

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
          hidden
          onChange={(event) => {
            appendFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <Stack
          direction={isRtl ? "row-reverse" : "row"}
          spacing={0.5}
          alignItems="center"
          sx={{
            direction: isRtl ? "rtl" : "ltr",
            minHeight: 50,
            paddingInlineEnd: 0.35,
            py: 0,
            mt: 0,
            mb: 0
          }}
        >
          <Tooltip title={t("aiAgent.image.upload")}>
            <span>
              <IconButton
                onClick={(event) => setAttachAnchor(event.currentTarget)}
                disabled={isSubmitting || isRecording}
                size="small"
                sx={{ alignSelf: "center", width: 34, height: 34 }}
              >
                <AddRoundedIcon sx={{ fontSize: 21 }} />
              </IconButton>
            </span>
          </Tooltip>

          <InputBase
            dir={isRtl ? "rtl" : "ltr"}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={placeholder}
            multiline
            minRows={1}
            maxRows={6}
            fullWidth
            inputProps={{
              dir: isRtl ? "rtl" : "ltr",
              lang: language,
              spellCheck: false,
              style: {
                direction: isRtl ? "rtl" : "ltr",
                textAlign: isRtl ? "right" : "left"
              }
            }}
            sx={{
              flex: 1,
              fontSize: { xs: 14, md: 15 },
              lineHeight: 1.45,
              alignSelf: "center",
              mt: 0,
              textAlign: "start",
              direction: isRtl ? "rtl" : "ltr",
              "& .MuiInputBase-inputMultiline": {
                py: 0.58,
                textAlign: "start",
                direction: isRtl ? "rtl" : "ltr"
              },
              "& textarea": {
                direction: isRtl ? "rtl" : "ltr",
                textAlign: isRtl ? "right" : "left"
              }
            }}
          />

          <Stack direction={isRtl ? "row-reverse" : "row"} spacing={0.45} alignItems="center" sx={{ alignSelf: "center", paddingInlineEnd: 0.25 }}>
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
                  size="small"
                  color={isRecording ? "error" : "default"}
                  sx={{ width: 36, height: 36 }}
                >
                  {isRecording ? <StopRoundedIcon sx={{ fontSize: 20 }} /> : <MicRoundedIcon sx={{ fontSize: 20 }} />}
                </IconButton>
              </span>
            </Tooltip>
            <IconButton
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || (!value.trim() && images.length === 0) || isRecording}
              size="small"
              sx={{
                width: 34,
                height: 34,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
                "&.Mui-disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled"
                }
              }}
            >
              <SendRoundedIcon
                sx={{
                  fontSize: 19,
                  transform: isRtl ? "scaleX(-1)" : "none"
                }}
              />
            </IconButton>
          </Stack>
        </Stack>

        <Menu
          dir={isRtl ? "rtl" : "ltr"}
          anchorEl={attachAnchor}
          open={Boolean(attachAnchor)}
          onClose={() => setAttachAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: isRtl ? "right" : "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: isRtl ? "right" : "left" }}
        >
          <MenuItem
            onClick={() => {
              setAttachAnchor(null);
              uploadInputRef.current?.click();
            }}
          >
            <Stack direction={isRtl ? "row-reverse" : "row"} spacing={1} alignItems="center">
              <AddPhotoAlternateRoundedIcon sx={{ fontSize: 18 }} />
              <span>{t("aiAgent.image.upload")}</span>
            </Stack>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAttachAnchor(null);
              void openCameraDialog();
            }}
          >
            <Stack direction={isRtl ? "row-reverse" : "row"} spacing={1} alignItems="center">
              <PhotoCameraRoundedIcon sx={{ fontSize: 18 }} />
              <span>{t("aiAgent.image.camera")}</span>
            </Stack>
          </MenuItem>
        </Menu>

        <Dialog
          open={cameraDialogOpen}
          onClose={handleCloseCameraDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{t("aiAgent.image.camera")}</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#000",
                  aspectRatio: "3 / 4",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Box
                  component="video"
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </Box>
              {cameraError ? (
                <Typography variant="body2" color="error">
                  {cameraError}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
            <Button onClick={handleCloseCameraDialog}>{t("common.cancel")}</Button>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={() => {
                  handleCloseCameraDialog();
                  void openCameraDialog();
                }}
                startIcon={<CameraswitchRoundedIcon />}
              >
                {t("aiAgent.image.retryCamera")}
              </Button>
              <Button variant="contained" startIcon={<PhotoCameraRoundedIcon />} onClick={() => void handleCapturePhoto()}>
                {t("aiAgent.image.capture")}
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>
      </Stack>
    </Paper>
  );
}
