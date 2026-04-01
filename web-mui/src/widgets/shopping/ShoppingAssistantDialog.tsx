import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../../features/ai/api/mcpApi";
import { runAgentTurn } from "../../features/ai/api/openaiAgentApi";
import { buildShoppingAssistantPrompt } from "../../features/ai/model/shoppingAssistantPrompt";
import type { ShoppingList } from "../../features/shopping/api/shoppingApi";
import { getAiAgentSettings } from "../../shared/config/aiAgent";
import { ContextAgentDialog } from "../ai/ContextAgentDialog";

type ShoppingAssistantDialogProps = {
  open: boolean;
  shoppingList: ShoppingList | null;
  onClose: () => void;
  onDataChanged?: () => Promise<void> | void;
};

export function ShoppingAssistantDialog({ open, shoppingList, onClose, onDataChanged }: ShoppingAssistantDialogProps) {
  const { t } = useLanguage();
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
        console.error("Failed to load shopping agent tools", error);
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
      panelKey={`shopping-page-agent-${open ? "open" : "closed"}`}
      isLoading={isLoading}
      loadError={status}
      quickPrompts={[
        t("contextAgent.shopping.prompt.analyze"),
        t("contextAgent.shopping.prompt.protein"),
        t("contextAgent.shopping.prompt.organize"),
        t("contextAgent.shopping.prompt.missing")
      ]}
      speechLanguage={agentSettings.speechLanguage}
      showToolOutput={agentSettings.showToolOutput}
      placeholder={t("contextAgent.shopping.placeholder")}
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
          systemPrompt: buildShoppingAssistantPrompt({
            shoppingList,
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
