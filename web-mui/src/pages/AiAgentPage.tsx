import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { Accordion, AccordionDetails, AccordionSummary, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../features/ai/api/mcpApi";
import { runAgentTurn } from "../features/ai/api/openaiAgentApi";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../shared/config/aiAgent";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { AgentWorkspace } from "../widgets/ai/AgentWorkspace";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function AiAgentPage() {
  const { t, language } = useLanguage();
  const { openSidebar, registerPageLoading, clearPageLoading } = useOutletContext<LayoutContext>();
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "error"; message: string } | null>(null);
  const [agentSettings, setAgentSettings] = useState(getAiAgentSettings());
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
          setAgentSettings(getAiAgentSettings());
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

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  return (
    <Stack spacing={{ xs: 1.5, md: 2 }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("aiAgent.title")} subtitle={t("aiAgent.subtitle")} />
      <PageTitle title={t("aiAgent.title")} />

      <Paper
        sx={{
          p: { xs: 0.75, md: 1.5 },
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          minHeight: { xs: "calc(100vh - 132px)", xl: "calc(100vh - 138px)" },
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(17,26,39,0.98), rgba(13,20,31,0.98))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))"
        }}
      >
        <Stack spacing={{ xs: 0.75, md: 1.25 }} sx={{ maxWidth: 1180, mx: "auto", minHeight: "100%" }}>
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
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 1.25, minHeight: 40 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HelpOutlineRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography fontWeight={700} sx={{ fontSize: { xs: 13, md: 14 } }}>{t("aiAgent.guide.title")}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, px: 1.25, pb: 1.25 }}>
              <Stack spacing={0.6}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 } }}>
                  {t("aiAgent.guide.intro")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 } }}>
                  {t("aiAgent.guide.itemMeal")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 } }}>
                  {t("aiAgent.guide.itemShopping")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 } }}>
                  {t("aiAgent.guide.itemRecipes")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, md: 13 } }}>
                  {t("aiAgent.guide.itemAnalysis")}
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>
          <AgentWorkspace
            panelKey="global-ai-agent"
            isLoading={isLoading}
            loadError={status?.message ?? null}
            quickPrompts={quickPrompts}
            speechLanguage={agentSettings.speechLanguage}
            showToolOutput={agentSettings.showToolOutput}
            placeholder={t("aiAgent.placeholder")}
            submitLabel={t("aiAgent.send")}
            missingApiKeyMessage={t("aiAgent.status.missingApiKey")}
            missingApiKeyActionLabel={t("aiAgent.openSettings")}
            onMissingApiKeyAction={() => {
              window.location.href = "/settings";
            }}
            onRun={async ({ apiKey, payload, messages, onToolStart, onToolEnd }) => {
              const normalizedText = payload.text.trim();
              const result = await runAgentTurn({
                apiKey,
                tools,
                history: messages,
                userText: normalizedText.length > 0 ? normalizedText : t("aiAgent.imageOnlyPrompt"),
                images: payload.images,
                model: agentSettings.model,
                userInstructions: agentSettings.userInstructions,
                responseLanguage: resolveAiResponseLanguage(agentSettings.speechLanguage, language),
                onToolStart,
                onToolEnd
              });

              return {
                appendedMessages: [...result.toolMessages, result.assistantMessage]
              };
            }}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
