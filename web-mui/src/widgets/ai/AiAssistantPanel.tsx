import { Alert, Box, Button, Stack } from "@mui/material";
import { useState, type ReactNode } from "react";
import { getOpenAiApiKey } from "../../shared/config/openai";
import type { AgentMessage } from "../../features/ai/api/openaiAgentApi";
import { AiAgentComposer } from "./AiAgentComposer";
import { AiAgentConversation } from "./AiAgentConversation";

type ComposerPayload = { text: string; images: Array<{ name: string; dataUrl: string }> };

type AiAssistantPanelRenderProps = {
  draft: string;
  setDraft: (value: string) => void;
  messages: AgentMessage[];
  visibleMessages: AgentMessage[];
  isSubmitting: boolean;
};

type AiAssistantPanelProps<TExtra = void> = {
  speechLanguage: "interface" | "en" | "ru";
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
      text: normalizedText || "[Image]"
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
      spacing={{ xs: 1, md: 1.5 }}
      sx={{
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
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            pb: { xs: 1, md: 1.25 }
          }}
        >
          <AiAgentConversation messages={visibleMessages} isSubmitting={isSubmitting} />
        </Box>
        {renderBottom?.({ draft, setDraft, messages, visibleMessages, isSubmitting })}
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
