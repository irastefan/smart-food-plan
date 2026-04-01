import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../../features/ai/api/mcpApi";
import { runAgentTurn } from "../../features/ai/api/openaiAgentApi";
import { buildMealPlanPageAssistantPrompt } from "../../features/ai/model/mealPlanPageAssistantPrompt";
import type { MealPlanDay } from "../../features/meal-plan/api/mealPlanApi";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../../shared/config/aiAgent";
import { ContextAgentDialog } from "../ai/ContextAgentDialog";

type MealPlanAssistantDialogProps = {
  open: boolean;
  date: string;
  day: MealPlanDay | null;
  onClose: () => void;
  onDataChanged?: () => Promise<void> | void;
};

export function MealPlanAssistantDialog({ open, date, day, onClose, onDataChanged }: MealPlanAssistantDialogProps) {
  const { t, language } = useLanguage();
  const agentSettings = getAiAgentSettings();
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [hasPendingDataRefresh, setHasPendingDataRefresh] = useState(false);

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

  useEffect(() => {
    if (!open) {
      setHasPendingDataRefresh(false);
    }
  }, [open]);

  function handleClose() {
    onClose();
    if (hasPendingDataRefresh) {
      void onDataChanged?.();
      setHasPendingDataRefresh(false);
    }
  }

  return (
    <ContextAgentDialog
      open={open}
      onClose={handleClose}
      panelKey={`meal-plan-page-agent-${date}-${open ? "open" : "closed"}`}
      isLoading={isLoading}
      loadError={status}
      quickPrompts={[
        t("contextAgent.mealPlan.prompt.analyzeDay"),
        t("contextAgent.mealPlan.prompt.improveBalance"),
        t("contextAgent.mealPlan.prompt.highProteinIdeas"),
        t("contextAgent.mealPlan.prompt.reviewDinner")
      ]}
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
          responseLanguage: resolveAiResponseLanguage(agentSettings.speechLanguage, language),
          systemPrompt: buildMealPlanPageAssistantPrompt({
            date,
            day,
            responseLanguage: resolveAiResponseLanguage(agentSettings.speechLanguage, language),
            userInstructions: agentSettings.userInstructions
          })
        });

        if (result.toolMessages.length > 0) {
          setHasPendingDataRefresh(true);
        }

        return { appendedMessages: [...result.toolMessages, result.assistantMessage] };
      }}
    />
  );
}
