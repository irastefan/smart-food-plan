import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { listMcpTools, type McpTool } from "../../features/ai/api/mcpApi";
import { runAgentTurn } from "../../features/ai/api/openaiAgentApi";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../../shared/config/aiAgent";
import { ContextAgentDialog } from "./ContextAgentDialog";

type GlobalAiAgentDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function GlobalAiAgentDialog({ open, onClose }: GlobalAiAgentDialogProps) {
  const { t, language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "error"; message: string } | null>(null);
  const [agentSettings, setAgentSettings] = useState(getAiAgentSettings());

  useEffect(() => {
    if (!open) {
      return;
    }

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
  }, [open, t]);

  return (
    <ContextAgentDialog
      open={open}
      onClose={onClose}
      panelKey="global-ai-agent-dialog"
      isLoading={isLoading}
      loadError={status?.message ?? null}
      quickPrompts={[
        t("aiAgent.prompt.analyzeDay"),
        t("aiAgent.prompt.addRecipe"),
        t("aiAgent.prompt.shoppingList"),
        t("aiAgent.prompt.improveMealPlan")
      ]}
      speechLanguage={agentSettings.speechLanguage}
      showToolOutput={agentSettings.showToolOutput}
      placeholder={t("aiAgent.placeholder")}
      submitLabel={t("aiAgent.send")}
      outerHeader={
        <Accordion
          disableGutters
          elevation={0}
          dir={isRtl ? "rtl" : "ltr"}
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
              <Typography fontWeight={700} sx={{ fontSize: { xs: 13, md: 14 }, textAlign: "start" }}>{t("aiAgent.guide.title")}</Typography>
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
      }
      onRun={async ({ payload, messages, onToolStart, onToolEnd }) => {
        const normalizedText = payload.text.trim();
        const result = await runAgentTurn({
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
  );
}
