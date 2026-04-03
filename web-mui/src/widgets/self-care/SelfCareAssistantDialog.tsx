import { Chip, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../../features/ai/api/mcpApi";
import { runAgentTurn } from "../../features/ai/api/openaiAgentApi";
import { buildSelfCareAssistantPrompt } from "../../features/ai/model/selfCareAssistantPrompt";
import type { SelfCareRoutineWeek, SelfCareWeekdayKey } from "../../features/self-care/api/selfCareApi";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../../shared/config/aiAgent";
import { ContextAgentDialog } from "../ai/ContextAgentDialog";

type SelfCareAssistantDialogProps = {
  open: boolean;
  week: SelfCareRoutineWeek | null;
  focusWeekday?: SelfCareWeekdayKey | null;
  onClose: () => void;
  onDataChanged?: () => Promise<void> | void;
};

export function SelfCareAssistantDialog({
  open,
  week,
  focusWeekday = null,
  onClose,
  onDataChanged
}: SelfCareAssistantDialogProps) {
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
        console.error("Failed to load self-care agent tools", error);
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
      panelKey={`self-care-page-agent-${open ? "open" : "closed"}`}
      isLoading={isLoading}
      loadError={status}
      outerHeader={
        focusWeekday ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" label={t(`selfCare.weekday.${focusWeekday.toLowerCase()}` as never)} />
          </Stack>
        ) : undefined
      }
      quickPrompts={[
        t("contextAgent.selfCare.prompt.analyze"),
        t("contextAgent.selfCare.prompt.simplify"),
        t("contextAgent.selfCare.prompt.consistency"),
        t("contextAgent.selfCare.prompt.weekend")
      ]}
      speechLanguage={agentSettings.speechLanguage}
      showToolOutput={agentSettings.showToolOutput}
      placeholder={t("contextAgent.selfCare.placeholder")}
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
          systemPrompt: buildSelfCareAssistantPrompt({
            week,
            responseLanguage: resolveAiResponseLanguage(agentSettings.speechLanguage, language),
            userInstructions: agentSettings.userInstructions,
            focusWeekday: focusWeekday ? t(`selfCare.weekday.${focusWeekday.toLowerCase()}` as never) : undefined
          }),
          onToolStart,
          onToolEnd
        });

        if (result.toolMessages.length > 0) {
          setHasPendingDataRefresh(true);
        }

        return { appendedMessages: [...result.toolMessages, result.assistantMessage] };
      }}
    />
  );
}
