import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../../features/ai/api/mcpApi";
import { runAgentTurn } from "../../features/ai/api/openaiAgentApi";
import { buildMealPlanPageAssistantPrompt } from "../../features/ai/model/mealPlanPageAssistantPrompt";
import type { MealPlanDay } from "../../features/meal-plan/api/mealPlanApi";
import { getAiAgentSettings } from "../../shared/config/aiAgent";
import { AgentWorkspace } from "../ai/AgentWorkspace";
import { PageAssistantDialogShell } from "../ai/PageAssistantDialogShell";

type MealPlanAssistantDialogProps = {
  open: boolean;
  date: string;
  day: MealPlanDay | null;
  onClose: () => void;
};

export function MealPlanAssistantDialog({ open, date, day, onClose }: MealPlanAssistantDialogProps) {
  const { t } = useLanguage();
  const agentSettings = getAiAgentSettings();
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

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
        }
      } catch (error) {
        console.error("Failed to load meal plan agent tools", error);
        if (!cancelled) {
          setStatus(t("contextAgent.status.toolsError"));
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
    <PageAssistantDialogShell open={open} onClose={onClose} title={t("contextAgent.mealPlan.title")}>
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ flex: 1, overflow: "auto", px: { xs: 2, md: 0 }, py: 2 }}>
          <Stack spacing={2} sx={{ maxWidth: 980, mx: "auto", height: "100%" }}>
            <AgentWorkspace
              panelKey={`meal-plan-page-agent-${date}-${open ? "open" : "closed"}`}
              isLoading={isLoading}
              loadError={status}
              quickPrompts={[
                t("contextAgent.mealPlan.prompt.analyzeDay"),
                t("contextAgent.mealPlan.prompt.improveBalance"),
                t("contextAgent.mealPlan.prompt.highProteinIdeas"),
                t("contextAgent.mealPlan.prompt.reviewDinner")
              ]}
              hint={
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {t("contextAgent.mealPlan.hint")}
                </Typography>
              }
              speechLanguage={agentSettings.speechLanguage}
              showToolOutput={agentSettings.showToolOutput}
              placeholder={t("contextAgent.mealPlan.placeholder")}
              submitLabel={t("aiAgent.send")}
              missingApiKeyMessage={t("aiAgent.status.missingApiKey")}
              missingApiKeyActionLabel={t("aiAgent.openSettings")}
              onMissingApiKeyAction={() => {
                window.location.href = "/settings";
              }}
              onRun={async ({ apiKey, payload, messages }) => {
                const normalizedText = payload.text.trim();
                const result = await runAgentTurn({
                  apiKey,
                  tools,
                  history: messages,
                  userText: normalizedText.length > 0 ? normalizedText : t("aiAgent.imageOnlyPrompt"),
                  images: payload.images,
                  model: agentSettings.model,
                  userInstructions: agentSettings.userInstructions,
                  systemPrompt: buildMealPlanPageAssistantPrompt({
                    date,
                    day,
                    userInstructions: agentSettings.userInstructions
                  })
                });

                return { appendedMessages: [...result.toolMessages, result.assistantMessage] };
              }}
            />
          </Stack>
        </Box>
      </Stack>
    </PageAssistantDialogShell>
  );
}
