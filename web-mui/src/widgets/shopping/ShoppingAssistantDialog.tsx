import { Alert, Box, CircularProgress, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { listMcpTools, type McpTool } from "../../features/ai/api/mcpApi";
import { runAgentTurn } from "../../features/ai/api/openaiAgentApi";
import { buildShoppingAssistantPrompt } from "../../features/ai/model/shoppingAssistantPrompt";
import type { ShoppingList } from "../../features/shopping/api/shoppingApi";
import { getAiAgentSettings } from "../../shared/config/aiAgent";
import { AiAssistantPanel } from "../ai/AiAssistantPanel";
import { PageAssistantDialogShell } from "../ai/PageAssistantDialogShell";

type ShoppingAssistantDialogProps = {
  open: boolean;
  shoppingList: ShoppingList | null;
  onClose: () => void;
};

export function ShoppingAssistantDialog({ open, shoppingList, onClose }: ShoppingAssistantDialogProps) {
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

  return (
    <PageAssistantDialogShell open={open} onClose={onClose} title={t("contextAgent.shopping.title")}>
      <Stack sx={{ height: "100%" }}>
        <Box sx={{ flex: 1, overflow: "auto", px: { xs: 2, md: 0 }, py: 2 }}>
          <Stack spacing={2} sx={{ maxWidth: 980, mx: "auto", height: "100%" }}>
            {status ? <Alert severity="error">{status}</Alert> : null}

            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                <CircularProgress />
              </Stack>
            ) : (
              <AiAssistantPanel
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

                  return { appendedMessages: [...result.toolMessages, result.assistantMessage] };
                }}
                renderTop={({ setDraft }) => (
                  <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", pb: 0.25, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
                    {[
                      t("contextAgent.shopping.prompt.analyze"),
                      t("contextAgent.shopping.prompt.protein"),
                      t("contextAgent.shopping.prompt.organize"),
                      t("contextAgent.shopping.prompt.missing")
                    ].map((prompt) => (
                      <Box
                        key={prompt}
                        onClick={() => setDraft(prompt)}
                        sx={{
                          flexShrink: 0,
                          px: 1.25,
                          py: 0.7,
                          borderRadius: 999,
                          border: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                          fontSize: 13,
                          cursor: "pointer"
                        }}
                      >
                        {prompt}
                      </Box>
                    ))}
                  </Stack>
                )}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </PageAssistantDialogShell>
  );
}
