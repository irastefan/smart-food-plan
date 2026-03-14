import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, CircularProgress, Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../features/ai/api/mcpApi";
import { runAgentTurn, type AgentMessage } from "../features/ai/api/openaiAgentApi";
import { getOpenAiApiKey } from "../shared/config/openai";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { AiAgentComposer } from "../widgets/ai/AiAgentComposer";
import { AiAgentConversation } from "../widgets/ai/AiAgentConversation";
import { AiAgentToolsCard } from "../widgets/ai/AiAgentToolsCard";
import { Button } from "@mui/material";

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

  async function handleSend(text: string) {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      setStatus({ type: "info", message: t("aiAgent.status.missingApiKey") });
      return;
    }

    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text
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
        userText: text
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
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, xl: 8 }}>
            <Stack spacing={2.5}>
              <AiAgentConversation
                messages={messages}
                emptyTitle={t("aiAgent.emptyTitle")}
                emptySubtitle={t("aiAgent.emptySubtitle")}
              />
              <AiAgentComposer
                isSubmitting={isSubmitting}
                placeholder={t("aiAgent.placeholder")}
                submitLabel={t("aiAgent.send")}
                onSubmit={handleSend}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, xl: 4 }}>
            <Stack spacing={2.5}>
              <AiAgentToolsCard
                title={t("aiAgent.tools.title")}
                subtitle={t("aiAgent.tools.subtitle", { count: tools.length })}
                tools={tools}
              />
              <Alert icon={<SmartToyRoundedIcon fontSize="inherit" />} severity="success">
                {t("aiAgent.mcpReady")}
              </Alert>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Stack>
  );
}
