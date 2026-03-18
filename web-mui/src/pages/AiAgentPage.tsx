import { Alert, Button, Chip, CircularProgress, Paper, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../features/ai/api/mcpApi";
import { runAgentTurn, type AgentMessage } from "../features/ai/api/openaiAgentApi";
import { getOpenAiApiKey } from "../shared/config/openai";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { AiAgentComposer } from "../widgets/ai/AiAgentComposer";
import { AiAgentConversation } from "../widgets/ai/AiAgentConversation";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function AiAgentPage() {
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [tools, setTools] = useState<McpTool[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "info"; message: string } | null>(null);
  const quickPrompts = [
    t("aiAgent.prompt.analyzeDay"),
    t("aiAgent.prompt.addRecipe"),
    t("aiAgent.prompt.shoppingList"),
    t("aiAgent.prompt.improveMealPlan")
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadTools() {
      try {
        setIsLoading(true);
        setStatus(null);
        const availableTools = await listMcpTools();
        if (!cancelled) {
          setTools(availableTools);
        }
      } catch (error) {
        console.error("Failed to load MCP tools", error);
        if (!cancelled) {
          setStatus({ type: "error", message: t("aiAgent.status.toolsError") });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTools();

    return () => {
      cancelled = true;
    };
  }, [t]);

  async function handleSend(payload: { text: string; images: Array<{ name: string; dataUrl: string }> }) {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      setStatus({ type: "info", message: t("aiAgent.status.missingApiKey") });
      return;
    }

    const normalizedText = payload.text.trim();
    const messageText =
      normalizedText.length > 0
        ? payload.images.length > 0
          ? `${normalizedText}\n\n[${t("aiAgent.imagesAttached", { count: payload.images.length })}]`
          : normalizedText
        : `[${t("aiAgent.imagesAttached", { count: payload.images.length })}]`;

    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: messageText
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);

    try {
      setIsSubmitting(true);
      setStatus(null);
      const result = await runAgentTurn({
        apiKey,
        tools,
        history: messages,
        userText: normalizedText.length > 0 ? normalizedText : t("aiAgent.imageOnlyPrompt"),
        images: payload.images
      });
      setMessages([...nextHistory, ...result.toolMessages, result.assistantMessage]);
    } catch (error) {
      console.error("Failed to run AI agent", error);
      setStatus({
        type: "error",
        message: error instanceof Error && error.message.trim().length > 0 ? error.message : t("aiAgent.status.runError")
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickPrompt(prompt: string) {
    if (isSubmitting) {
      return;
    }

    await handleSend({ text: prompt, images: [] });
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("aiAgent.title")} subtitle={t("aiAgent.subtitle")} />

      {status ? (
        <Alert
          severity={status.type}
          action={status.type === "info" ? <Button component={RouterLink} to="/settings">{t("aiAgent.openSettings")}</Button> : undefined}
        >
          {status.message}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
          <CircularProgress />
        </Stack>
      ) : (
        <Paper
          sx={{
            p: { xs: 1.25, md: 2.5 },
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            minHeight: { xs: "calc(100vh - 170px)", xl: "calc(100vh - 150px)" },
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(17,26,39,0.98), rgba(13,20,31,0.98))"
                : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))"
          }}
        >
          <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ maxWidth: 980, mx: "auto", minHeight: "100%" }}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {quickPrompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  variant="outlined"
                  clickable
                  onClick={() => void handleQuickPrompt(prompt)}
                  sx={{ height: 32 }}
                />
              ))}
            </Stack>
            <AiAgentConversation
              messages={messages}
              emptyTitle={t("aiAgent.emptyTitle")}
              emptySubtitle={t("aiAgent.emptySubtitle")}
              isSubmitting={isSubmitting}
            />
            <AiAgentComposer
              isSubmitting={isSubmitting}
              placeholder={t("aiAgent.placeholder")}
              submitLabel={t("aiAgent.send")}
              onSubmit={handleSend}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
