import { Alert, Box, Button, Stack } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { getOpenAiApiKey } from "../../shared/config/openai";
import type { AgentMessage } from "../../features/ai/api/openaiAgentApi";
import type { Language } from "../../shared/i18n/messages";
import { AiAgentComposer } from "./AiAgentComposer";
import { AiAgentConversation } from "./AiAgentConversation";

export type ComposerPayload = { text: string; images: Array<{ name: string; dataUrl: string }> };

export type AiAssistantPanelRenderProps = {
  draft: string;
  setDraft: (value: string) => void;
  messages: AgentMessage[];
  visibleMessages: AgentMessage[];
  isSubmitting: boolean;
};

export type AiAssistantPanelProps<TExtra = void> = {
  speechLanguage: "interface" | Language;
  showToolOutput: boolean;
  placeholder: string;
  submitLabel: string;
  missingApiKeyMessage: string;
  missingApiKeyActionLabel?: string;
  onMissingApiKeyAction?: () => void;
  onRun: (input: {
    apiKey: string;
    payload: ComposerPayload;
    messages: AgentMessage[];
  }) => Promise<{ appendedMessages: AgentMessage[]; extra?: TExtra }>;
  onExtraResult?: (extra: TExtra | undefined) => void;
  renderTop?: (props: AiAssistantPanelRenderProps) => ReactNode;
  renderBottom?: (props: AiAssistantPanelRenderProps) => ReactNode;
};

export function AiAssistantPanel<TExtra = void>({
  speechLanguage,
  showToolOutput,
  placeholder,
  submitLabel,
  missingApiKeyMessage,
  missingApiKeyActionLabel,
  onMissingApiKeyAction,
  onRun,
  onExtraResult,
  renderTop,
  renderBottom
}: AiAssistantPanelProps<TExtra>) {
  const { language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "info"; message: string } | null>(null);

  const visibleMessages = showToolOutput ? messages : messages.filter((message) => message.role !== "tool");

  async function handleSubmit(payload: ComposerPayload) {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      setStatus({ type: "info", message: missingApiKeyMessage });
      return;
    }

    const normalizedText = payload.text.trim();
    if (!normalizedText && payload.images.length === 0) {
      return;
    }

    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: normalizedText || "[Image]",
      images: payload.images
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);

    try {
      setIsSubmitting(true);
      setStatus(null);
      const result = await onRun({ apiKey, payload, messages });
      setMessages([...nextHistory, ...result.appendedMessages]);
      onExtraResult?.(result.extra);
    } catch (error) {
      console.error("Failed to run AI assistant panel", error);
      setStatus({
        type: "error",
        message: error instanceof Error && error.message.trim() ? error.message : "AI request failed."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack
      dir={isRtl ? "rtl" : "ltr"}
      spacing={{ xs: 1, md: 1.5 }}
      sx={{
        direction: isRtl ? "rtl" : "ltr",
        flex: 1,
        minHeight: 0
      }}
    >
      {status ? (
        <Alert
          severity={status.type}
          action={
            status.type === "info" && missingApiKeyActionLabel && onMissingApiKeyAction
              ? <Button onClick={onMissingApiKeyAction}>{missingApiKeyActionLabel}</Button>
              : undefined
          }
        >
          {status.message}
        </Alert>
      ) : null}
      {renderTop?.({ draft, setDraft, messages, visibleMessages, isSubmitting })}
      <Box
        sx={{
          direction: isRtl ? "rtl" : "ltr",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box
          sx={{
            direction: isRtl ? "rtl" : "ltr",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pb: { xs: 1, md: 1.25 },
            paddingInlineEnd: 0.5,
            scrollbarWidth: "thin",
            scrollbarColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(148,163,184,0.34) transparent" : "rgba(100,116,139,0.24) transparent",
            "&::-webkit-scrollbar": {
              width: 10
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(148,163,184,0.28)" : "rgba(100,116,139,0.22)",
              borderRadius: 999,
              border: "3px solid transparent",
              backgroundClip: "padding-box"
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(148,163,184,0.42)" : "rgba(100,116,139,0.34)"
            }
          }}
        >
          <AiAgentConversation messages={visibleMessages} isSubmitting={isSubmitting} />
          <Box sx={{ pt: { xs: 1.5, md: 2 } }}>
            {renderBottom?.({ draft, setDraft, messages, visibleMessages, isSubmitting })}
          </Box>
        </Box>
        <AiAgentComposer
          isSubmitting={isSubmitting}
          placeholder={placeholder}
          submitLabel={submitLabel}
          value={draft}
          speechLanguage={speechLanguage}
          onValueChange={setDraft}
          onSubmit={handleSubmit}
        />
      </Box>
    </Stack>
  );
}
