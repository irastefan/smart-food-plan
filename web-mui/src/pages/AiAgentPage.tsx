import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
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
  const [draft, setDraft] = useState("");
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

  function handleQuickPrompt(prompt: string) {
    setDraft(prompt);
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
            <Paper
              sx={{
                p: { xs: 2, md: 2.5 },
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(180deg, rgba(20,31,45,0.96), rgba(12,20,30,0.96))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))"
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 44, height: 44, bgcolor: "primary.main", color: "primary.contrastText" }}>
                  <SmartToyRoundedIcon />
                </Avatar>
                <Stack spacing={0.25}>
                  <Typography fontWeight={800}>{t("aiAgent.hero.title")}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("aiAgent.hero.subtitle")}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Accordion
              disableGutters
              elevation={0}
              sx={{
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
                "&::before": { display: "none" }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 1.5, minHeight: 44 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HelpOutlineRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography fontWeight={700}>{t("aiAgent.guide.title")}</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, px: 1.5, pb: 1.5 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {t("aiAgent.guide.intro")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("aiAgent.guide.itemMeal")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("aiAgent.guide.itemShopping")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("aiAgent.guide.itemRecipes")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("aiAgent.guide.itemAnalysis")}
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                overflowX: "auto",
                overflowY: "hidden",
                flexWrap: "nowrap",
                pb: 0.5,
                scrollSnapType: "x proximity",
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": {
                  display: "none"
                },
                scrollbarWidth: "none"
              }}
            >
              {quickPrompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  variant="outlined"
                  clickable
                  onClick={() => handleQuickPrompt(prompt)}
                  sx={{ height: 32, flexShrink: 0, scrollSnapAlign: "start" }}
                />
              ))}
            </Stack>
            <AiAgentConversation
              messages={messages}
              isSubmitting={isSubmitting}
            />
            <AiAgentComposer
              isSubmitting={isSubmitting}
              placeholder={t("aiAgent.placeholder")}
              submitLabel={t("aiAgent.send")}
              value={draft}
              onValueChange={setDraft}
              onSubmit={handleSend}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
